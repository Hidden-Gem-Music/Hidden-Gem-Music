using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.HiddenGems;
using Capstone.API.Models.Shared;
using Microsoft.AspNetCore.WebUtilities;

namespace Capstone.API.Infrastructure.Repositories
{
    /// <summary>
    /// Resolves song metadata from Deezer on demand and persists a local cache for reuse.
    /// </summary>
    public class DeezerSongEnrichmentService : IDeezerSongEnrichmentService
    {
        private const int DeezerMaxRequests = 50;
        private const int DeezerMaxRetryAttempts = 3;
        private static readonly TimeSpan UnresolvedRetryWindow = TimeSpan.FromHours(12);
        private static readonly TimeSpan DeezerWindow = TimeSpan.FromSeconds(4.9);
        private static readonly TimeSpan[] DeezerRetryDelays =
        [
            TimeSpan.FromMilliseconds(250),
            TimeSpan.FromMilliseconds(800),
            TimeSpan.FromMilliseconds(1600)
        ];
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
        {
            WriteIndented = true
        };

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IWebHostEnvironment _environment;
        private readonly SemaphoreSlim _cacheGate = new(1, 1);
        private readonly SlidingWindowRateLimiter _rateLimiter = new(DeezerMaxRequests, DeezerWindow);
        private readonly string _cacheDirectoryPath;
        private readonly string _cacheJsonPath;
        private readonly string _cacheCsvPath;
        private readonly string _cacheTxtPath;

        private Dictionary<string, LiveSongCacheEntry> _cacheByKey = new(StringComparer.Ordinal);
        private bool _cacheLoaded;

        /// <summary>
        /// Initializes a new instance of the DeezerSongEnrichmentService class.
        /// </summary>
        public DeezerSongEnrichmentService(IHttpClientFactory httpClientFactory, IWebHostEnvironment environment)
        {
            _httpClientFactory = httpClientFactory;
            _environment = environment;
            _cacheDirectoryPath = Path.Combine(_environment.ContentRootPath, "live_song_enrichment_cache");
            _cacheJsonPath = Path.Combine(_cacheDirectoryPath, "live_song_cache.json");
            _cacheCsvPath = Path.Combine(_cacheDirectoryPath, "live_song_cache.csv");
            _cacheTxtPath = Path.Combine(_cacheDirectoryPath, "live_song_cache.txt");
        }

        /// <inheritdoc />
        public async Task<HiddenGem?> EnrichHiddenGemAsync(HiddenGem item, CancellationToken cancellationToken = default)
        {
            var liveData = await ResolveSongMetadataAsync(item.SongName ?? string.Empty, item.ArtistName ?? string.Empty, cancellationToken);
            if (liveData is null)
            {
                return null;
            }

            return ApplyLiveData(item, liveData);
        }

        /// <inheritdoc />
        public async Task<DeezerSongMetadata?> ResolveSongMetadataAsync(
            string songName,
            string artistName,
            CancellationToken cancellationToken = default)
        {
            var trimmedSongName = songName.Trim();
            var trimmedArtistName = artistName.Trim();
            if (string.IsNullOrWhiteSpace(trimmedSongName) || string.IsNullOrWhiteSpace(trimmedArtistName))
            {
                return null;
            }

            await EnsureCacheLoadedAsync(cancellationToken);

            var cacheKey = BuildCacheKey(trimmedSongName, trimmedArtistName);
            var cached = await GetCachedEntryAsync(cacheKey, cancellationToken);
            if (cached is not null)
            {
                if (cached.IsUnresolved && cached.LastVerifiedUtc >= DateTimeOffset.UtcNow.Subtract(UnresolvedRetryWindow))
                {
                    return null;
                }

                var cachedResult = await ResolveFromCachedEntryAsync(cached, cancellationToken);
                if (cachedResult is not null)
                {
                    return ToMetadata(cachedResult);
                }
            }

            LiveSongCacheEntry? resolved;
            try
            {
                resolved = await SearchAndResolveAsync(trimmedSongName, trimmedArtistName, cancellationToken);
            }
            catch (Exception ex) when (IsTransientDeezerException(ex, cancellationToken))
            {
                if (cached is not null && !cached.IsUnresolved)
                {
                    return ToMetadata(ToSafeFallbackCacheEntry(cached));
                }

                return null;
            }

            if (resolved is null)
            {
                await UpsertCacheEntryAsync(cacheKey, LiveSongCacheEntry.CreateUnresolved(trimmedSongName, trimmedArtistName), cancellationToken);
                return null;
            }

            await UpsertCacheEntryAsync(cacheKey, resolved, cancellationToken);
            return ToMetadata(resolved);
        }

        private async Task EnsureCacheLoadedAsync(CancellationToken cancellationToken)
        {
            if (_cacheLoaded)
            {
                return;
            }

            await _cacheGate.WaitAsync(cancellationToken);
            try
            {
                if (_cacheLoaded)
                {
                    return;
                }

                Directory.CreateDirectory(_cacheDirectoryPath);
                if (File.Exists(_cacheJsonPath))
                {
                    await using var stream = File.OpenRead(_cacheJsonPath);
                    var loaded = await JsonSerializer.DeserializeAsync<List<LiveSongCacheEntry>>(stream, JsonOptions, cancellationToken);
                    _cacheByKey = (loaded ?? [])
                        .Where(entry => !string.IsNullOrWhiteSpace(entry.SongName) && !string.IsNullOrWhiteSpace(entry.ArtistName))
                        .GroupBy(entry => BuildCacheKey(entry.SongName!, entry.ArtistName!))
                        .ToDictionary(group => group.Key, group => group.Last(), StringComparer.Ordinal);
                }

                _cacheLoaded = true;
            }
            finally
            {
                _cacheGate.Release();
            }
        }

        private async Task<LiveSongCacheEntry?> GetCachedEntryAsync(string cacheKey, CancellationToken cancellationToken)
        {
            await _cacheGate.WaitAsync(cancellationToken);
            try
            {
                return _cacheByKey.TryGetValue(cacheKey, out var entry) ? entry : null;
            }
            finally
            {
                _cacheGate.Release();
            }
        }

        private async Task UpsertCacheEntryAsync(string cacheKey, LiveSongCacheEntry entry, CancellationToken cancellationToken)
        {
            await _cacheGate.WaitAsync(cancellationToken);
            try
            {
                _cacheByKey[cacheKey] = entry with { LastVerifiedUtc = DateTimeOffset.UtcNow };
                await PersistCacheAsync(cancellationToken);
            }
            finally
            {
                _cacheGate.Release();
            }
        }

        private async Task PersistCacheAsync(CancellationToken cancellationToken)
        {
            Directory.CreateDirectory(_cacheDirectoryPath);

            var snapshot = _cacheByKey.Values
                .OrderBy(entry => entry.SongName, StringComparer.OrdinalIgnoreCase)
                .ThenBy(entry => entry.ArtistName, StringComparer.OrdinalIgnoreCase)
                .ToList();

            await File.WriteAllTextAsync(_cacheJsonPath, JsonSerializer.Serialize(snapshot, JsonOptions), cancellationToken);

            var resolved = snapshot.Where(entry => !entry.IsUnresolved).ToList();
            var csvLines = new List<string>
            {
                "song_name,album_name,artist_name,deezer_track_id,deezer_album_id,deezer_artist_id,artist_image_url,album_art_url,genres,preview_url,preview_expires_at,explicit_lyrics,explicit_content_cover,album_explicit_lyrics,release_date,record_type,contributors,nb_album,tracklist,last_verified_utc"
            };

            foreach (var entry in resolved)
            {
                csvLines.Add(string.Join(",",
                    Csv(entry.SongName),
                    Csv(entry.AlbumName),
                    Csv(entry.ArtistName),
                    Csv(entry.DeezerTrackId?.ToString()),
                    Csv(entry.DeezerAlbumId?.ToString()),
                    Csv(entry.DeezerArtistId?.ToString()),
                    Csv(entry.ArtistImageUrl),
                    Csv(entry.AlbumArtUrl),
                    Csv(string.Join("|", entry.Genres)),
                    Csv(entry.PreviewUrl),
                    Csv(entry.PreviewExpiresAtUtc?.ToString("O")),
                    Csv(entry.ExplicitLyrics?.ToString()),
                    Csv(entry.ExplicitContentCover?.ToString()),
                    Csv(entry.AlbumExplicitLyrics?.ToString()),
                    Csv(entry.ReleaseDate),
                    Csv(entry.RecordType),
                    Csv(string.Join("|", entry.Contributors)),
                    Csv(entry.ArtistAlbumCount?.ToString()),
                    Csv(string.Join("|", entry.Tracklist)),
                    Csv(entry.LastVerifiedUtc.ToString("O"))));
            }

            await File.WriteAllLinesAsync(_cacheCsvPath, csvLines, cancellationToken);

            var txtBlocks = resolved.Select(entry => string.Join(Environment.NewLine, new[]
            {
                $"song_name: {entry.SongName}",
                $"album_name: {entry.AlbumName}",
                $"artist_name: {entry.ArtistName}",
                $"deezer_track_id: {entry.DeezerTrackId}",
                $"deezer_album_id: {entry.DeezerAlbumId}",
                $"deezer_artist_id: {entry.DeezerArtistId}",
                $"artist_image_url: {entry.ArtistImageUrl}",
                $"album_art_url: {entry.AlbumArtUrl}",
                $"genres: {string.Join(", ", entry.Genres)}",
                $"preview_url: {entry.PreviewUrl}",
                $"preview_expires_at: {entry.PreviewExpiresAtUtc:O}",
                $"explicit_lyrics: {entry.ExplicitLyrics}",
                $"explicit_content_cover: {entry.ExplicitContentCover}",
                $"album_explicit_lyrics: {entry.AlbumExplicitLyrics}",
                $"release_date: {entry.ReleaseDate}",
                $"record_type: {entry.RecordType}",
                $"contributors: {string.Join(", ", entry.Contributors)}",
                $"nb_album: {entry.ArtistAlbumCount}",
                $"tracklist: {string.Join(" | ", entry.Tracklist)}",
                $"last_verified_utc: {entry.LastVerifiedUtc:O}"
            }));

            await File.WriteAllTextAsync(_cacheTxtPath, string.Join($"{Environment.NewLine}{Environment.NewLine}", txtBlocks), cancellationToken);
        }

        private async Task<LiveSongCacheEntry?> ResolveFromCachedEntryAsync(LiveSongCacheEntry cached, CancellationToken cancellationToken)
        {
            if (IsPreviewStillValid(cached))
            {
                return cached;
            }

            if (!cached.DeezerTrackId.HasValue)
            {
                return null;
            }

            LiveSongCacheEntry? refreshed;
            try
            {
                refreshed = await ResolveFromTrackIdAsync(cached.DeezerTrackId.Value, cancellationToken);
            }
            catch (Exception ex) when (IsTransientDeezerException(ex, cancellationToken))
            {
                return ToSafeFallbackCacheEntry(cached);
            }

            if (refreshed is null)
            {
                return ToSafeFallbackCacheEntry(cached);
            }

            refreshed = refreshed with
            {
                SongName = refreshed.SongName ?? cached.SongName,
                AlbumName = Prefer(refreshed.AlbumName, cached.AlbumName),
                ArtistName = refreshed.ArtistName ?? cached.ArtistName,
                Genres = refreshed.Genres.Count > 0 ? refreshed.Genres : cached.Genres,
                Contributors = refreshed.Contributors.Count > 0 ? refreshed.Contributors : cached.Contributors,
                ArtistImageUrl = Prefer(refreshed.ArtistImageUrl, cached.ArtistImageUrl),
                AlbumArtUrl = Prefer(refreshed.AlbumArtUrl, cached.AlbumArtUrl),
                ReleaseDate = Prefer(refreshed.ReleaseDate, cached.ReleaseDate),
                RecordType = Prefer(refreshed.RecordType, cached.RecordType),
                ArtistAlbumCount = refreshed.ArtistAlbumCount ?? cached.ArtistAlbumCount,
                Tracklist = refreshed.Tracklist.Count > 0 ? refreshed.Tracklist : cached.Tracklist,
                ExplicitContentCover = refreshed.ExplicitContentCover ?? cached.ExplicitContentCover,
                AlbumExplicitLyrics = refreshed.AlbumExplicitLyrics ?? cached.AlbumExplicitLyrics
            };

            var cacheKey = BuildCacheKey(cached.SongName ?? string.Empty, cached.ArtistName ?? string.Empty);
            await UpsertCacheEntryAsync(cacheKey, refreshed, cancellationToken);
            return refreshed;
        }

        private async Task<LiveSongCacheEntry?> SearchAndResolveAsync(string songName, string artistName, CancellationToken cancellationToken)
        {
            var client = _httpClientFactory.CreateClient("DeezerApi");
            var queryCandidates = BuildQueryCandidates(songName, artistName);
            DeezerTrackDto? matchedTrack = null;

            foreach (var query in queryCandidates)
            {
                var payload = await GetJsonAsync<DeezerSearchResponse>(client, $"search?q={Uri.EscapeDataString(query)}", cancellationToken);
                var tracks = payload?.Data ?? [];
                matchedTrack = SelectBestTrackMatch(tracks, songName, artistName);
                if (matchedTrack is not null)
                {
                    break;
                }
            }

            return matchedTrack is null ? null : await ResolveFromTrackAsync(matchedTrack, cancellationToken);
        }

        private async Task<LiveSongCacheEntry?> ResolveFromTrackIdAsync(long deezerTrackId, CancellationToken cancellationToken)
        {
            var client = _httpClientFactory.CreateClient("DeezerApi");
            var track = await GetJsonAsync<DeezerTrackDto>(client, $"track/{deezerTrackId}", cancellationToken);
            return track is null ? null : await ResolveFromTrackAsync(track, cancellationToken);
        }

        private async Task<LiveSongCacheEntry?> ResolveFromTrackAsync(DeezerTrackDto track, CancellationToken cancellationToken)
        {
            if (track.Id <= 0 || string.IsNullOrWhiteSpace(track.Preview))
            {
                return null;
            }

            var client = _httpClientFactory.CreateClient("DeezerApi");
            DeezerAlbumDto? album = null;
            DeezerArtistDto? artist = null;

            if (track.Album?.Id > 0)
            {
                album = await GetJsonAsync<DeezerAlbumDto>(client, $"album/{track.Album.Id}", cancellationToken);
            }

            if (track.Artist?.Id > 0)
            {
                artist = await GetJsonAsync<DeezerArtistDto>(client, $"artist/{track.Artist.Id}", cancellationToken);
            }

            return new LiveSongCacheEntry
            {
                SongName = Prefer(track.Title, track.TitleShort),
                AlbumName = Prefer(album?.Title, track.Album?.Title),
                ArtistName = Prefer(track.Artist?.Name, artist?.Name),
                DeezerTrackId = track.Id,
                DeezerAlbumId = track.Album?.Id,
                DeezerArtistId = track.Artist?.Id,
                ArtistImageUrl = ChooseImageUrl(artist?.PictureXl, artist?.PictureMedium, track.Artist?.PictureXl, track.Artist?.PictureMedium),
                AlbumArtUrl = ChooseImageUrl(album?.CoverXl, album?.CoverMedium, track.Album?.CoverXl, track.Album?.CoverMedium),
                Genres = (album?.Genres?.Data ?? []).Select(genre => genre.Name?.Trim()).Where(value => !string.IsNullOrWhiteSpace(value)).Distinct(StringComparer.OrdinalIgnoreCase).Cast<string>().ToList(),
                PreviewUrl = track.Preview?.Trim(),
                PreviewExpiresAtUtc = ParsePreviewExpiry(track.Preview),
                ExplicitLyrics = track.ExplicitLyrics,
                ExplicitContentCover = ToExplicitFlag(album?.ExplicitContentCover),
                AlbumExplicitLyrics = album?.ExplicitLyrics ?? ToExplicitFlag(album?.ExplicitContentLyrics),
                ReleaseDate = Prefer(album?.ReleaseDate, track.ReleaseDate),
                RecordType = album?.RecordType?.Trim(),
                Contributors = (album?.Contributors ?? []).Select(contributor => contributor.Name?.Trim()).Where(value => !string.IsNullOrWhiteSpace(value)).Distinct(StringComparer.OrdinalIgnoreCase).Cast<string>().ToList(),
                ArtistAlbumCount = artist?.NbAlbum,
                Tracklist = (album?.Tracks?.Data ?? []).Select(trackItem => trackItem.Title?.Trim()).Where(value => !string.IsNullOrWhiteSpace(value)).Cast<string>().ToList(),
                IsUnresolved = false,
                LastVerifiedUtc = DateTimeOffset.UtcNow
            };
        }

        private async Task<T?> GetJsonAsync<T>(HttpClient client, string relativePath, CancellationToken cancellationToken)
        {
            for (var attempt = 1; attempt <= DeezerMaxRetryAttempts; attempt += 1)
            {
                try
                {
                    await _rateLimiter.WaitForSlotAsync(cancellationToken);
                    return await client.GetFromJsonAsync<T>(relativePath, cancellationToken);
                }
                catch (HttpRequestException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return default;
                }
                catch (Exception ex) when (IsTransientDeezerException(ex, cancellationToken) && attempt < DeezerMaxRetryAttempts)
                {
                    await Task.Delay(DeezerRetryDelays[Math.Min(attempt - 1, DeezerRetryDelays.Length - 1)], cancellationToken);
                }
            }

            return default;
        }

        private static HiddenGem ApplyLiveData(HiddenGem source, DeezerSongMetadata liveData)
        {
            return new HiddenGem
            {
                SongName = Prefer(liveData.SongName, source.SongName),
                AlbumName = Prefer(liveData.AlbumName, source.AlbumName),
                ArtistName = Prefer(liveData.ArtistName, source.ArtistName),
                Genre = liveData.Genres.FirstOrDefault() ?? source.Genre,
                PreviewUrl = liveData.PreviewUrl,
                TrendScore = source.TrendScore,
                CountriesChartingCount = source.CountriesChartingCount,
                DeezerTrackId = liveData.DeezerTrackId,
                DeezerAlbumId = liveData.DeezerAlbumId,
                DeezerArtistId = liveData.DeezerArtistId,
                ArtistImageUrl = liveData.ArtistImageUrl,
                AlbumArtUrl = liveData.AlbumArtUrl,
                Genres = liveData.Genres,
                ExplicitLyrics = liveData.ExplicitLyrics,
                ExplicitContentCover = liveData.ExplicitContentCover,
                AlbumExplicitLyrics = liveData.AlbumExplicitLyrics,
                ReleaseDate = liveData.ReleaseDate,
                RecordType = liveData.RecordType,
                Contributors = liveData.Contributors,
                ArtistAlbumCount = liveData.ArtistAlbumCount,
                Tracklist = liveData.Tracklist,
                PreviewExpiresAtUtc = liveData.PreviewExpiresAtUtc
            };
        }

        private static DeezerSongMetadata ToMetadata(LiveSongCacheEntry entry)
        {
            return new DeezerSongMetadata
            {
                SongName = entry.SongName,
                AlbumName = entry.AlbumName,
                ArtistName = entry.ArtistName,
                DeezerTrackId = entry.DeezerTrackId,
                DeezerAlbumId = entry.DeezerAlbumId,
                DeezerArtistId = entry.DeezerArtistId,
                ArtistImageUrl = entry.ArtistImageUrl,
                AlbumArtUrl = entry.AlbumArtUrl,
                Genres = entry.Genres,
                PreviewUrl = entry.PreviewUrl,
                PreviewExpiresAtUtc = entry.PreviewExpiresAtUtc,
                ExplicitLyrics = entry.ExplicitLyrics,
                ExplicitContentCover = entry.ExplicitContentCover,
                AlbumExplicitLyrics = entry.AlbumExplicitLyrics,
                ReleaseDate = entry.ReleaseDate,
                RecordType = entry.RecordType,
                Contributors = entry.Contributors,
                ArtistAlbumCount = entry.ArtistAlbumCount,
                Tracklist = entry.Tracklist
            };
        }

        private static List<string> BuildQueryCandidates(string songName, string artistName)
        {
            var simplifiedSong = SimplifyForSearch(songName);
            var simplifiedArtist = SimplifyForSearch(artistName);
            return
            [
                $"track:\"{songName}\" artist:\"{artistName}\"",
                $"track:\"{simplifiedSong}\" artist:\"{artistName}\"",
                $"{songName} {artistName}",
                $"{simplifiedSong} {artistName}",
                $"{songName} {simplifiedArtist}"
            ];
        }

        private static DeezerTrackDto? SelectBestTrackMatch(IEnumerable<DeezerTrackDto> tracks, string songName, string artistName)
        {
            var wantedSong = NormalizeText(songName);
            var wantedArtist = NormalizeText(artistName);
            var wantedSongSimple = SimplifyForSearch(songName);
            var wantedArtistSimple = SimplifyForSearch(artistName);

            var materialized = tracks.ToList();
            foreach (var track in materialized)
            {
                if (NormalizeText(track.Title) == wantedSong && NormalizeText(track.Artist?.Name) == wantedArtist)
                {
                    return track;
                }
            }

            foreach (var track in materialized)
            {
                if (SimplifyForSearch(track.Title) == wantedSongSimple &&
                    SimplifyForSearch(track.Artist?.Name) == wantedArtistSimple)
                {
                    return track;
                }
            }

            foreach (var track in materialized)
            {
                var candidateTitle = NormalizeText(track.Title);
                var candidateArtist = NormalizeText(track.Artist?.Name);
                if (candidateArtist == wantedArtist &&
                    (candidateTitle.StartsWith(wantedSong, StringComparison.Ordinal) || wantedSong.StartsWith(candidateTitle, StringComparison.Ordinal)))
                {
                    return track;
                }
            }

            return materialized.FirstOrDefault();
        }

        private static string BuildCacheKey(string songName, string artistName)
        {
            return $"{NormalizeText(songName)}||{NormalizeText(artistName)}";
        }

        private static string NormalizeText(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            return string.Join(' ', value.Trim().ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
        }

        private static string SimplifyForSearch(string? value)
        {
            var normalized = NormalizeText(value);
            var filtered = new string(normalized.Select(character => char.IsLetterOrDigit(character) || char.IsWhiteSpace(character) ? character : ' ').ToArray());
            return string.Join(' ', filtered.Split(' ', StringSplitOptions.RemoveEmptyEntries));
        }

        private static string? Prefer(string? preferred, string? fallback)
        {
            return !string.IsNullOrWhiteSpace(preferred) ? preferred : fallback;
        }

        private static string? ChooseImageUrl(params string?[] values)
        {
            return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
        }

        private static LiveSongCacheEntry ToSafeFallbackCacheEntry(LiveSongCacheEntry cached)
        {
            if (IsPreviewStillValid(cached))
            {
                return cached;
            }

            return cached with
            {
                PreviewUrl = null,
                PreviewExpiresAtUtc = null
            };
        }

        private static bool IsPreviewStillValid(LiveSongCacheEntry entry)
        {
            return !string.IsNullOrWhiteSpace(entry.PreviewUrl) &&
                   entry.PreviewExpiresAtUtc.HasValue &&
                   entry.PreviewExpiresAtUtc.Value > DateTimeOffset.UtcNow;
        }

        private static bool IsTransientDeezerException(Exception exception, CancellationToken cancellationToken)
        {
            if (cancellationToken.IsCancellationRequested)
            {
                return false;
            }

            return exception switch
            {
                TaskCanceledException => true,
                HttpRequestException httpRequestException when httpRequestException.StatusCode != System.Net.HttpStatusCode.NotFound => true,
                _ => false
            };
        }

        private static DateTimeOffset? ParsePreviewExpiry(string? previewUrl)
        {
            if (string.IsNullOrWhiteSpace(previewUrl) || !Uri.TryCreate(previewUrl, UriKind.Absolute, out var uri))
            {
                return null;
            }

            var parsed = QueryHelpers.ParseQuery(uri.Query);
            if (!parsed.TryGetValue("hdnea", out var hdneaValues))
            {
                return null;
            }

            foreach (var chunk in hdneaValues.ToString().Split('~', StringSplitOptions.RemoveEmptyEntries))
            {
                if (!chunk.StartsWith("exp=", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var rawSeconds = chunk["exp=".Length..];
                if (long.TryParse(rawSeconds, out var unixSeconds))
                {
                    return DateTimeOffset.FromUnixTimeSeconds(unixSeconds);
                }
            }

            return null;
        }

        private static bool? ToExplicitFlag(int? value)
        {
            return value.HasValue ? value.Value > 0 : null;
        }

        private static string Csv(string? value)
        {
            var safe = value ?? string.Empty;
            if (safe.Contains('"') || safe.Contains(',') || safe.Contains('\n') || safe.Contains('\r'))
            {
                return $"\"{safe.Replace("\"", "\"\"")}\"";
            }

            return safe;
        }

        private sealed class SlidingWindowRateLimiter
        {
            private readonly int _maxRequests;
            private readonly TimeSpan _window;
            private readonly Queue<DateTimeOffset> _timestamps = new();
            private readonly SemaphoreSlim _gate = new(1, 1);

            public SlidingWindowRateLimiter(int maxRequests, TimeSpan window)
            {
                _maxRequests = maxRequests;
                _window = window;
            }

            public async Task WaitForSlotAsync(CancellationToken cancellationToken)
            {
                while (true)
                {
                    TimeSpan? delay = null;

                    await _gate.WaitAsync(cancellationToken);
                    try
                    {
                        var now = DateTimeOffset.UtcNow;
                        while (_timestamps.Count > 0 && now - _timestamps.Peek() >= _window)
                        {
                            _timestamps.Dequeue();
                        }

                        if (_timestamps.Count < _maxRequests)
                        {
                            _timestamps.Enqueue(now);
                            return;
                        }

                        delay = _window - (now - _timestamps.Peek());
                    }
                    finally
                    {
                        _gate.Release();
                    }

                    await Task.Delay(delay.GetValueOrDefault(TimeSpan.FromMilliseconds(25)), cancellationToken);
                }
            }
        }

        private sealed record LiveSongCacheEntry
        {
            public string? SongName { get; init; }
            public string? AlbumName { get; init; }
            public string? ArtistName { get; init; }
            public long? DeezerTrackId { get; init; }
            public long? DeezerAlbumId { get; init; }
            public long? DeezerArtistId { get; init; }
            public string? ArtistImageUrl { get; init; }
            public string? AlbumArtUrl { get; init; }
            public List<string> Genres { get; init; } = [];
            public string? PreviewUrl { get; init; }
            public DateTimeOffset? PreviewExpiresAtUtc { get; init; }
            public bool? ExplicitLyrics { get; init; }
            public bool? ExplicitContentCover { get; init; }
            public bool? AlbumExplicitLyrics { get; init; }
            public string? ReleaseDate { get; init; }
            public string? RecordType { get; init; }
            public List<string> Contributors { get; init; } = [];
            public int? ArtistAlbumCount { get; init; }
            public List<string> Tracklist { get; init; } = [];
            public bool IsUnresolved { get; init; }
            public DateTimeOffset LastVerifiedUtc { get; init; }

            public static LiveSongCacheEntry CreateUnresolved(string songName, string artistName)
            {
                return new LiveSongCacheEntry
                {
                    SongName = songName,
                    ArtistName = artistName,
                    IsUnresolved = true,
                    LastVerifiedUtc = DateTimeOffset.UtcNow
                };
            }
        }

        private sealed class DeezerSearchResponse
        {
            [JsonPropertyName("data")]
            public List<DeezerTrackDto> Data { get; set; } = [];
        }

        private sealed class DeezerTrackDto
        {
            [JsonPropertyName("id")]
            public long Id { get; set; }

            [JsonPropertyName("title")]
            public string? Title { get; set; }

            [JsonPropertyName("title_short")]
            public string? TitleShort { get; set; }

            [JsonPropertyName("preview")]
            public string? Preview { get; set; }

            [JsonPropertyName("explicit_lyrics")]
            public bool? ExplicitLyrics { get; set; }

            [JsonPropertyName("release_date")]
            public string? ReleaseDate { get; set; }

            [JsonPropertyName("artist")]
            public DeezerArtistRef? Artist { get; set; }

            [JsonPropertyName("album")]
            public DeezerAlbumRef? Album { get; set; }
        }

        private class DeezerArtistRef
        {
            [JsonPropertyName("id")]
            public long Id { get; set; }

            [JsonPropertyName("name")]
            public string? Name { get; set; }

            [JsonPropertyName("picture_xl")]
            public string? PictureXl { get; set; }

            [JsonPropertyName("picture_medium")]
            public string? PictureMedium { get; set; }
        }

        private sealed class DeezerArtistDto : DeezerArtistRef
        {
            [JsonPropertyName("nb_album")]
            public int? NbAlbum { get; set; }
        }

        private class DeezerAlbumRef
        {
            [JsonPropertyName("id")]
            public long Id { get; set; }

            [JsonPropertyName("title")]
            public string? Title { get; set; }

            [JsonPropertyName("cover_xl")]
            public string? CoverXl { get; set; }

            [JsonPropertyName("cover_medium")]
            public string? CoverMedium { get; set; }
        }

        private sealed class DeezerAlbumDto : DeezerAlbumRef
        {
            [JsonPropertyName("genres")]
            public DeezerGenreContainer? Genres { get; set; }

            [JsonPropertyName("contributors")]
            public List<DeezerNameRef> Contributors { get; set; } = [];

            [JsonPropertyName("record_type")]
            public string? RecordType { get; set; }

            [JsonPropertyName("release_date")]
            public string? ReleaseDate { get; set; }

            [JsonPropertyName("explicit_content_cover")]
            public int? ExplicitContentCover { get; set; }

            [JsonPropertyName("explicit_lyrics")]
            public bool? ExplicitLyrics { get; set; }

            [JsonPropertyName("explicit_content_lyrics")]
            public int? ExplicitContentLyrics { get; set; }

            [JsonPropertyName("tracks")]
            public DeezerTrackContainer? Tracks { get; set; }
        }

        private sealed class DeezerGenreContainer
        {
            [JsonPropertyName("data")]
            public List<DeezerNameRef> Data { get; set; } = [];
        }

        private sealed class DeezerNameRef
        {
            [JsonPropertyName("id")]
            public long Id { get; set; }

            [JsonPropertyName("name")]
            public string? Name { get; set; }
        }

        private sealed class DeezerTrackContainer
        {
            [JsonPropertyName("data")]
            public List<DeezerTrackListItemDto> Data { get; set; } = [];
        }

        private sealed class DeezerTrackListItemDto
        {
            [JsonPropertyName("title")]
            public string? Title { get; set; }
        }
    }
}
