using System.Text.Json;
using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.Country;

namespace Capstone.API.Infrastructure.Repositories
{
    /// <summary>
    /// Persists Discovery sample results so normal app browsing can seed a reusable local cache.
    /// </summary>
    public class FileBackedDiscoverySampleCacheService : IDiscoverySampleCacheService
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        private readonly string _cachePath;
        private readonly SemaphoreSlim _gate = new(1, 1);
        private Dictionary<string, DiscoverySampleCacheEntry>? _entriesByKey;

        public FileBackedDiscoverySampleCacheService(IWebHostEnvironment environment)
        {
            _cachePath = Path.Combine(environment.ContentRootPath, "Data", "discovery_samples_cache.json");
        }

        public async Task<IReadOnlyList<string>> GetGenresAsync(string countryCode, int year, CancellationToken cancellationToken = default)
        {
            var entry = await GetEntryAsync(countryCode, year, cancellationToken);
            return entry is null ? Array.Empty<string>() : entry.Genres;
        }

        public async Task<IReadOnlyList<string>> GetLanguagesAsync(string countryCode, int year, CancellationToken cancellationToken = default)
        {
            var entry = await GetEntryAsync(countryCode, year, cancellationToken);
            return entry is null ? Array.Empty<string>() : entry.Languages;
        }

        public async Task<IReadOnlyList<FavoriteArtistSample>> GetFavoriteArtistsAsync(string countryCode, int year, CancellationToken cancellationToken = default)
        {
            var entry = await GetEntryAsync(countryCode, year, cancellationToken);
            return entry is null ? Array.Empty<FavoriteArtistSample>() : entry.FavoriteArtists;
        }

        public Task SaveGenresAsync(string countryCode, int year, IReadOnlyList<string> genres, CancellationToken cancellationToken = default)
        {
            return SaveAsync(countryCode, year, entry => entry.Genres = CleanValues(genres), cancellationToken);
        }

        public Task SaveLanguagesAsync(string countryCode, int year, IReadOnlyList<string> languages, CancellationToken cancellationToken = default)
        {
            return SaveAsync(countryCode, year, entry => entry.Languages = CleanValues(languages), cancellationToken);
        }

        public Task SaveFavoriteArtistsAsync(string countryCode, int year, IReadOnlyList<FavoriteArtistSample> favoriteArtists, CancellationToken cancellationToken = default)
        {
            return SaveAsync(countryCode, year, entry => entry.FavoriteArtists = CleanFavoriteArtists(favoriteArtists), cancellationToken);
        }

        public async Task<IReadOnlyList<DiscoverySampleCacheEntry>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            await EnsureLoadedAsync(cancellationToken);
            return _entriesByKey!.Values
                .OrderBy(entry => entry.Year)
                .ThenBy(entry => entry.CountryCode)
                .ToList();
        }

        private async Task<DiscoverySampleCacheEntry?> GetEntryAsync(string countryCode, int year, CancellationToken cancellationToken)
        {
            await EnsureLoadedAsync(cancellationToken);
            _entriesByKey!.TryGetValue(BuildKey(countryCode, year), out var entry);
            return entry;
        }

        private async Task SaveAsync(string countryCode, int year, Action<DiscoverySampleCacheEntry> update, CancellationToken cancellationToken)
        {
            await _gate.WaitAsync(cancellationToken);
            try
            {
                await EnsureLoadedCoreAsync(cancellationToken);
                var normalizedCode = countryCode.Trim().ToUpperInvariant();
                var key = BuildKey(normalizedCode, year);
                if (!_entriesByKey!.TryGetValue(key, out var entry))
                {
                    entry = new DiscoverySampleCacheEntry
                    {
                        CountryCode = normalizedCode,
                        Year = year
                    };
                    _entriesByKey[key] = entry;
                }

                update(entry);
                entry.UpdatedAtUtc = DateTime.UtcNow;
                await WriteCacheAsync(cancellationToken);
            }
            finally
            {
                _gate.Release();
            }
        }

        private async Task EnsureLoadedAsync(CancellationToken cancellationToken)
        {
            if (_entriesByKey is not null)
            {
                return;
            }

            await _gate.WaitAsync(cancellationToken);
            try
            {
                await EnsureLoadedCoreAsync(cancellationToken);
            }
            finally
            {
                _gate.Release();
            }
        }

        private async Task EnsureLoadedCoreAsync(CancellationToken cancellationToken)
        {
            if (_entriesByKey is not null)
            {
                return;
            }

            if (!File.Exists(_cachePath))
            {
                _entriesByKey = new Dictionary<string, DiscoverySampleCacheEntry>(StringComparer.OrdinalIgnoreCase);
                return;
            }

            await using var stream = File.OpenRead(_cachePath);
            var entries = await JsonSerializer.DeserializeAsync<List<DiscoverySampleCacheEntry>>(stream, JsonOptions, cancellationToken)
                ?? new List<DiscoverySampleCacheEntry>();

            _entriesByKey = entries
                .Where(entry => !string.IsNullOrWhiteSpace(entry.CountryCode) && entry.Year > 0)
                .GroupBy(entry => BuildKey(entry.CountryCode, entry.Year), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    group => group.Key,
                    group => group.Last(),
                    StringComparer.OrdinalIgnoreCase);
        }

        private async Task WriteCacheAsync(CancellationToken cancellationToken)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(_cachePath)!);
            var entries = _entriesByKey!.Values
                .OrderBy(entry => entry.Year)
                .ThenBy(entry => entry.CountryCode)
                .ToList();

            await using var stream = File.Create(_cachePath);
            await JsonSerializer.SerializeAsync(stream, entries, JsonOptions, cancellationToken);
        }

        private static string BuildKey(string countryCode, int year)
        {
            return $"{countryCode.Trim().ToUpperInvariant()}::{year}";
        }

        private static List<string> CleanValues(IEnumerable<string> values)
        {
            return values
                .Select(value => value.Trim())
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(3)
                .ToList();
        }

        private static List<FavoriteArtistSample> CleanFavoriteArtists(IEnumerable<FavoriteArtistSample> favoriteArtists)
        {
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var cleaned = new List<FavoriteArtistSample>();

            foreach (var artist in favoriteArtists)
            {
                var name = artist.Artist.Trim();
                if (string.IsNullOrWhiteSpace(name) || !seen.Add(name))
                {
                    continue;
                }

                cleaned.Add(new FavoriteArtistSample
                {
                    Artist = name,
                    SongTitle = artist.SongTitle.Trim(),
                    ArtistImageUrl = string.IsNullOrWhiteSpace(artist.ArtistImageUrl) ? null : artist.ArtistImageUrl.Trim()
                });

                if (cleaned.Count >= 8)
                {
                    break;
                }
            }

            return cleaned;
        }
    }
}
