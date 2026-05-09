using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.Country;
using Capstone.API.Models.Shared;

namespace Capstone.API.Infrastructure.Repositories
{
    /// <summary>
    /// Retrieves country profile and hidden gems preview data.
    /// Uses GetDataSetsAsync for sp_GetCountryProfile because it returns multiple result sets:
    /// result set 0 = summary stats, set 1 = top shared songs, set 2 = top unique songs.
    /// </summary>
    public class CountryRepository : ICountryRepository
    {
        private static readonly string[] PreferredGenrePrefixes = ["B", "I", "Y"];
        private const int RawSongBatchSize = 100;
        private const int GenreSampleScanCapPerList = 200;

        private readonly IDataRepository _db;
        private readonly IDeezerSongEnrichmentService _deezerSongEnrichmentService;

        /// <summary>
        /// Initializes a new instance of CountryRepository using the default connection.
        /// </summary>
        public CountryRepository(
            IDataRepositoryFactory factory,
            IDeezerSongEnrichmentService deezerSongEnrichmentService)
        {
            _db = factory.Create("DefaultConnection");
            _deezerSongEnrichmentService = deezerSongEnrichmentService;
        }

        /// <inheritdoc/>
        public async Task<CountryProfile?> GetCountryProfileAsync(string countryCode, int year, CancellationToken cancellationToken = default)
        {
            var sets = await _db.GetDataSetsAsync("sp_GetCountryProfile", new Dictionary<string, object?>
            {
                { "@CountryCode", countryCode },
                { "@Year", year }
            });

            if (sets.Count == 0 || sets[0].Count == 0)
                return null;

            var stats = sets[0][0];

            var profile = new CountryProfile
            {
                CountryCode = RowValueReader.AsStringAny(stats, "country_code", "iso_code"),
                CountryName = RowValueReader.AsStringAny(stats, "country_name", "full_name"),
                Year = RowValueReader.AsIntAny(stats, "chart_year", "year"),
                TotalCharted = RowValueReader.AsIntAny(stats, "total_charted"),
                SharedCount = RowValueReader.AsIntAny(stats, "shared_count"),
                UniqueCount = RowValueReader.AsIntAny(stats, "unique_count"),
                OverlapPct = RowValueReader.AsDecimalAny(stats, "overlap_pct")
            };

            if (sets.Count > 1)
                profile.TopSharedSongs = await EnrichSongRowsAsync(sets[1].Select(MapSong), limit: 10, cancellationToken);

            if (sets.Count > 2)
                profile.TopUniqueSongs = await EnrichSongRowsAsync(sets[2].Select(MapSong), limit: 10, cancellationToken);

            profile.SampleGenres = (await GetCountryGenreSampleAsync(countryCode, year, cancellationToken)).ToList();

            return profile;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<CountryHiddenGemPreviewItem>> GetHiddenGemsPreviewAsync(string countryCode, int year, int limit, CancellationToken cancellationToken = default)
        {
            var requestedLimit = Math.Max(limit, 1);
            var rawLimit = Math.Min(Math.Max(requestedLimit * 4, requestedLimit + 20), 100);

            var rows = await _db.GetDataAsync("sp_GetCountryHiddenGemsPreview", new Dictionary<string, object?>
            {
                { "@CountryCode", countryCode },
                { "@Year", year },
                { "@Limit", rawLimit }
            });

            var results = new List<CountryHiddenGemPreviewItem>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var row in rows)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var enriched = await EnrichPreviewItemAsync(MapHiddenGem(row), cancellationToken);
                if (enriched is null)
                {
                    continue;
                }

                var songName = enriched.SongName?.Trim();
                var artistName = enriched.ArtistName?.Trim();
                var duplicateKey = $"{songName?.ToLowerInvariant()}||{artistName?.ToLowerInvariant()}";
                if (string.IsNullOrWhiteSpace(songName) || string.IsNullOrWhiteSpace(artistName) || !seen.Add(duplicateKey))
                {
                    continue;
                }

                results.Add(enriched);
                if (results.Count >= requestedLimit)
                {
                    break;
                }
            }

            return results;
        }

        /// <inheritdoc/>
        public async Task<CountrySongsPage> GetCountrySongsPageAsync(string countryCode, int year, string listType, int page, int pageSize, CancellationToken cancellationToken = default)
        {
            var safePage = Math.Max(page, 1);
            var safePageSize = Math.Clamp(pageSize, 1, 100);
            var offset = (safePage - 1) * safePageSize;
            var requestedStartIndex = offset;
            var requestedEndIndexExclusive = requestedStartIndex + safePageSize;
            var totalResolvedCount = 0;
            var results = new List<Song>();
            var hasMore = false;
            var totalRawCount = 0;

            var scanOffset = 0;

            while (true)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var scanRows = (await _db.GetDataAsync("sp_GetCountrySongsPaged", new Dictionary<string, object?>
                {
                    { "@CountryCode", countryCode },
                    { "@Year", year },
                    { "@ListType", listType },
                    { "@Offset", scanOffset },
                    { "@PageSize", RawSongBatchSize }
                })).ToList();

                if (scanRows.Count == 0)
                {
                    break;
                }

                totalRawCount = RowValueReader.AsIntAny(scanRows[0], "total_count", "TotalCount");
                foreach (var row in scanRows)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var enriched = await EnrichSongAsync(MapSong(row), cancellationToken);
                    if (enriched is null)
                    {
                        continue;
                    }

                    if (totalResolvedCount >= requestedStartIndex && totalResolvedCount < requestedEndIndexExclusive)
                    {
                        results.Add(enriched);
                    }

                    totalResolvedCount++;
                    if (totalResolvedCount >= requestedEndIndexExclusive + 1)
                    {
                        hasMore = true;
                        break;
                    }
                }

                if (hasMore)
                {
                    break;
                }

                scanOffset += scanRows.Count;
                if (scanOffset >= totalRawCount)
                {
                    break;
                }
            }

            return new CountrySongsPage
            {
                Items = results,
                Page = safePage,
                PageSize = safePageSize,
                TotalCount = totalResolvedCount,
                HasMore = hasMore
            };
        }

        /// <inheritdoc/>
        public async Task<IReadOnlyList<string>> GetCountryGenreSampleAsync(string countryCode, int year, CancellationToken cancellationToken = default)
        {
            var selectedGenres = new List<string>(3);
            var seenGenres = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var prefix in PreferredGenrePrefixes)
            {
                var genre = await FindDistinctGenreForPrefixAsync(countryCode, year, prefix, seenGenres, cancellationToken);
                if (string.IsNullOrWhiteSpace(genre))
                {
                    continue;
                }

                seenGenres.Add(genre);
                selectedGenres.Add(genre);
            }

            if (selectedGenres.Count < 3)
            {
                await FillRemainingDistinctGenresAsync(countryCode, year, selectedGenres, seenGenres, cancellationToken);
            }

            return selectedGenres;
        }

        private async Task<List<Song>> EnrichSongRowsAsync(IEnumerable<Song> songs, int limit, CancellationToken cancellationToken)
        {
            var results = new List<Song>();
            foreach (var song in songs)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var enriched = await EnrichSongAsync(song, cancellationToken);
                if (enriched is null)
                {
                    continue;
                }

                results.Add(enriched);
                if (results.Count >= limit)
                {
                    break;
                }
            }

            return results;
        }

        private async Task<Song?> EnrichSongAsync(Song song, CancellationToken cancellationToken)
        {
            var songName = song.SongName?.Trim();
            var artistName = song.ArtistName?.Trim();
            if (string.IsNullOrWhiteSpace(songName) || string.IsNullOrWhiteSpace(artistName))
            {
                return null;
            }

            var metadata = await _deezerSongEnrichmentService.ResolveSongMetadataAsync(songName, artistName, cancellationToken);
            if (metadata is null)
            {
                return null;
            }

            song.SongName = metadata.SongName ?? song.SongName;
            song.AlbumName = metadata.AlbumName ?? song.AlbumName;
            song.ArtistName = metadata.ArtistName ?? song.ArtistName;
            song.DeezerTrackId = metadata.DeezerTrackId;
            song.DeezerAlbumId = metadata.DeezerAlbumId;
            song.DeezerArtistId = metadata.DeezerArtistId;
            song.ArtistImageUrl = metadata.ArtistImageUrl;
            song.AlbumArtUrl = metadata.AlbumArtUrl;
            song.Genres = metadata.Genres;
            song.PreviewUrl = metadata.PreviewUrl;
            song.PreviewExpiresAtUtc = metadata.PreviewExpiresAtUtc;
            song.ExplicitLyrics = metadata.ExplicitLyrics;
            song.ExplicitContentCover = metadata.ExplicitContentCover;
            song.AlbumExplicitLyrics = metadata.AlbumExplicitLyrics;
            song.ReleaseDate = metadata.ReleaseDate;
            song.RecordType = metadata.RecordType;
            song.Contributors = metadata.Contributors;
            song.ArtistAlbumCount = metadata.ArtistAlbumCount;
            return song;
        }

        private async Task<CountryHiddenGemPreviewItem?> EnrichPreviewItemAsync(CountryHiddenGemPreviewItem item, CancellationToken cancellationToken)
        {
            var songName = item.SongName?.Trim();
            var artistName = item.ArtistName?.Trim();
            if (string.IsNullOrWhiteSpace(songName) || string.IsNullOrWhiteSpace(artistName))
            {
                return null;
            }

            var metadata = await _deezerSongEnrichmentService.ResolveSongMetadataAsync(songName, artistName, cancellationToken);
            if (metadata is null)
            {
                return null;
            }

            item.SongName = metadata.SongName ?? item.SongName;
            item.AlbumName = metadata.AlbumName ?? item.AlbumName;
            item.ArtistName = metadata.ArtistName ?? item.ArtistName;
            item.DeezerTrackId = metadata.DeezerTrackId;
            item.DeezerAlbumId = metadata.DeezerAlbumId;
            item.DeezerArtistId = metadata.DeezerArtistId;
            item.ArtistImageUrl = metadata.ArtistImageUrl;
            item.AlbumArtUrl = metadata.AlbumArtUrl;
            item.Genres = metadata.Genres;
            item.PreviewUrl = metadata.PreviewUrl;
            item.PreviewExpiresAtUtc = metadata.PreviewExpiresAtUtc;
            item.ExplicitLyrics = metadata.ExplicitLyrics;
            item.ExplicitContentCover = metadata.ExplicitContentCover;
            item.AlbumExplicitLyrics = metadata.AlbumExplicitLyrics;
            item.ReleaseDate = metadata.ReleaseDate;
            item.RecordType = metadata.RecordType;
            item.Contributors = metadata.Contributors;
            item.ArtistAlbumCount = metadata.ArtistAlbumCount;
            return item;
        }

        private async Task<string?> FindDistinctGenreForPrefixAsync(
            string countryCode,
            int year,
            string prefix,
            HashSet<string> seenGenres,
            CancellationToken cancellationToken)
        {
            foreach (var listType in new[] { "shared", "unique" })
            {
                var inspectedRows = 0;
                var scanOffset = 0;

                while (inspectedRows < GenreSampleScanCapPerList)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var rows = (await _db.GetDataAsync("sp_GetCountrySongsPaged", new Dictionary<string, object?>
                    {
                        { "@CountryCode", countryCode },
                        { "@Year", year },
                        { "@ListType", listType },
                        { "@Offset", scanOffset },
                        { "@PageSize", RawSongBatchSize }
                    })).ToList();

                    if (rows.Count == 0)
                    {
                        break;
                    }

                    var totalRawCount = RowValueReader.AsIntAny(rows[0], "total_count", "TotalCount");
                    foreach (var row in rows)
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        inspectedRows++;
                        var mapped = MapSong(row);
                        if (!SongStartsWithPrefix(mapped.SongName, prefix))
                        {
                            continue;
                        }

                        var enriched = await EnrichSongAsync(mapped, cancellationToken);
                        var primaryGenre = GetPrimaryGenre(enriched);
                        if (string.IsNullOrWhiteSpace(primaryGenre) || seenGenres.Contains(primaryGenre))
                        {
                            continue;
                        }

                        return primaryGenre;
                    }

                    scanOffset += rows.Count;
                    if (scanOffset >= totalRawCount)
                    {
                        break;
                    }
                }
            }

            return null;
        }

        private async Task FillRemainingDistinctGenresAsync(
            string countryCode,
            int year,
            List<string> selectedGenres,
            HashSet<string> seenGenres,
            CancellationToken cancellationToken)
        {
            foreach (var listType in new[] { "shared", "unique" })
            {
                var inspectedRows = 0;
                var scanOffset = 0;

                while (selectedGenres.Count < 3 && inspectedRows < GenreSampleScanCapPerList)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var rows = (await _db.GetDataAsync("sp_GetCountrySongsPaged", new Dictionary<string, object?>
                    {
                        { "@CountryCode", countryCode },
                        { "@Year", year },
                        { "@ListType", listType },
                        { "@Offset", scanOffset },
                        { "@PageSize", RawSongBatchSize }
                    })).ToList();

                    if (rows.Count == 0)
                    {
                        break;
                    }

                    var totalRawCount = RowValueReader.AsIntAny(rows[0], "total_count", "TotalCount");
                    foreach (var row in rows)
                    {
                        cancellationToken.ThrowIfCancellationRequested();
                        inspectedRows++;
                        var enriched = await EnrichSongAsync(MapSong(row), cancellationToken);
                        var primaryGenre = GetPrimaryGenre(enriched);
                        if (string.IsNullOrWhiteSpace(primaryGenre) || seenGenres.Contains(primaryGenre))
                        {
                            continue;
                        }

                        seenGenres.Add(primaryGenre);
                        selectedGenres.Add(primaryGenre);
                        if (selectedGenres.Count >= 3)
                        {
                            return;
                        }
                    }

                    scanOffset += rows.Count;
                    if (scanOffset >= totalRawCount)
                    {
                        break;
                    }
                }
            }
        }

        private static string? GetPrimaryGenre(Song? song)
        {
            return song?.Genres.FirstOrDefault((genre) => !string.IsNullOrWhiteSpace(genre))?.Trim();
        }

        private static bool SongStartsWithPrefix(string? songName, string prefix)
        {
            var trimmed = songName?.TrimStart();
            return !string.IsNullOrWhiteSpace(trimmed) && trimmed.StartsWith(prefix, StringComparison.OrdinalIgnoreCase);
        }

        private static Song MapSong(IDictionary<string, object?> row)
        {
            return new Song
            {
                SongName = RowValueReader.AsStringAny(row, "song_name", "song_title", "title"),
                ArtistName = RowValueReader.AsStringAny(row, "artist_name"),
                AlbumName = RowValueReader.AsStringAny(row, "album_name")
            };
        }

        private static CountryHiddenGemPreviewItem MapHiddenGem(IDictionary<string, object?> row)
        {
            return new CountryHiddenGemPreviewItem
            {
                SongName = RowValueReader.AsStringAny(row, "song_name", "song_title", "title"),
                AlbumName = RowValueReader.AsStringAny(row, "album_name"),
                ArtistName = RowValueReader.AsStringAny(row, "artist_name"),
                TrendScore = RowValueReader.AsDecimalAny(row, "trend_score"),
                CountriesChartingCount = RowValueReader.AsIntAny(row, "countries_charting_count", "countries_charting")
            };
        }
    }
}
