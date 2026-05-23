using Capstone.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Text.RegularExpressions;

namespace Capstone.API.Controllers
{
    /// <summary>
    /// Serves data for the Country Profile screen.
    /// </summary>
    [ApiController]
    [Route("api/country")]
    public class CountryController : ControllerBase
    {
        private static readonly Regex CountryCodeRegex = new("^[A-Za-z]{2}$", RegexOptions.Compiled);

        private const int DefaultPreviewLimit = 5;
        private const int MaxPreviewLimit = 25;
        private const int DefaultSongsPage = 1;
        private const int DefaultSongsPageSize = 50;
        private const int MaxSongsPageSize = 100;
        private const int MaxGenreSampleCodes = 16;
        private const int MaxLanguageSampleCodes = 16;
        private const string AvailableYearsCacheKey = "country-controller-available-years";

        private readonly ICountryRepository _repo;
        private readonly IMetadataRepository _metadataRepo;
        private readonly IDiscoverySampleCacheService _discoverySampleCache;
        private readonly IPresentationDataCacheService _presentationDataCache;
        private readonly ILogger<CountryController> _logger;
        private readonly IMemoryCache _memoryCache;

        /// <summary>
        /// Initializes a new instance of CountryController.
        /// </summary>
        public CountryController(
            ICountryRepository repo,
            IMetadataRepository metadataRepo,
            IDiscoverySampleCacheService discoverySampleCache,
            IPresentationDataCacheService presentationDataCache,
            IMemoryCache memoryCache,
            ILogger<CountryController> logger)
        {
            _repo = repo;
            _metadataRepo = metadataRepo;
            _discoverySampleCache = discoverySampleCache;
            _presentationDataCache = presentationDataCache;
            _memoryCache = memoryCache;
            _logger = logger;
        }

        /// <summary>
        /// Returns full chart statistics and top song lists for a single country and year.
        /// GET /api/country/{code}?year={year}
        /// </summary>
        /// <param name="code">2-letter ISO country code (e.g. "US", "JP").</param>
        /// <param name="year">The chart year to display. Defaults to 2021.</param>
        [HttpGet("{code}")]
        public async Task<IActionResult> GetCountryProfile(string code, [FromQuery] int year = 2021, CancellationToken cancellationToken = default)
        {
            try
            {
                var validationError = await ValidateInputsAsync(code, year, cancellationToken);
                if (validationError != null)
                    return BadRequest(new { message = validationError });

                var normalizedCode = code.ToUpperInvariant();
                var cacheKey = BuildPresentationCacheKey("country-profile", normalizedCode, year);
                var cached = await _presentationDataCache.GetAsync(cacheKey, cancellationToken);
                if (cached.HasValue)
                {
                    return Ok(cached.Value);
                }

                var result = await _repo.GetCountryProfileAsync(normalizedCode, year, cancellationToken);
                if (result == null)
                    return NotFound();

                var favoriteArtists = BuildFavoriteArtists(result);
                if (favoriteArtists.Count > 0)
                    BackgroundTaskLogger.LogFailure(
                        _discoverySampleCache.SaveFavoriteArtistsAsync(normalizedCode, year, favoriteArtists),
                        _logger,
                        $"favorite artists {normalizedCode} {year}");

                BackgroundTaskLogger.LogFailure(_presentationDataCache.SaveAsync(cacheKey, result), _logger, cacheKey);
                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting country profile for {CountryCode} year {Year}", code, year);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving country profile data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting country profile for {CountryCode} year {Year}", code, year);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving country profile data." });
            }
        }

        /// <summary>
        /// Returns the top 5 hidden gems for the teaser widget on the country profile page.
        /// GET /api/country/{code}/hidden-gems/preview?year={year}
        /// </summary>
        /// <param name="code">2-letter ISO country code.</param>
        /// <param name="year">The chart year to display. Defaults to 2021.</param>
        [HttpGet("{code}/hidden-gems/preview")]
        public async Task<IActionResult> GetHiddenGemsPreview(string code, [FromQuery] int year = 2021, [FromQuery] int limit = DefaultPreviewLimit, CancellationToken cancellationToken = default)
        {
            var normalizedLimit = Math.Clamp(limit, 1, MaxPreviewLimit);

            try
            {
                var validationError = await ValidateInputsAsync(code, year, cancellationToken);
                if (validationError != null)
                    return BadRequest(new { message = validationError });

                var normalizedCode = code.ToUpperInvariant();
                var cacheKey = BuildPresentationCacheKey("country-hidden-gems-preview", normalizedCode, year, normalizedLimit);
                var cached = await _presentationDataCache.GetAsync(cacheKey, cancellationToken);
                if (cached.HasValue)
                {
                    return Ok(cached.Value);
                }

                var result = await _repo.GetHiddenGemsPreviewAsync(normalizedCode, year, normalizedLimit, cancellationToken);
                BackgroundTaskLogger.LogFailure(_presentationDataCache.SaveAsync(cacheKey, result), _logger, cacheKey);
                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting hidden gems preview for {CountryCode} year {Year}", code, year);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving hidden gems preview data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting hidden gems preview for {CountryCode} year {Year}", code, year);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving hidden gems preview data." });
            }
        }

        /// <summary>
        /// Returns paginated shared or unique songs for the country page list panels.
        /// GET /api/country/{code}/songs?year={year}&amp;listType={shared|unique}&amp;page={page}&amp;pageSize={pageSize}
        /// </summary>
        /// <param name="code">2-letter ISO country code.</param>
        /// <param name="year">The chart year to display.</param>
        /// <param name="listType">Either "shared" or "unique".</param>
        /// <param name="page">1-based page number.</param>
        /// <param name="pageSize">Results per page.</param>
        [HttpGet("{code}/songs")]
        public async Task<IActionResult> GetCountrySongs(
            string code,
            [FromQuery] int year = 2021,
            [FromQuery] string listType = "shared",
            [FromQuery] int page = DefaultSongsPage,
            [FromQuery] int pageSize = DefaultSongsPageSize,
            CancellationToken cancellationToken = default)
        {
            var normalizedListType = listType.Trim().ToLowerInvariant();
            if (normalizedListType != "shared" && normalizedListType != "unique")
                return BadRequest(new { message = "listType must be either 'shared' or 'unique'." });

            var normalizedPage = Math.Max(page, 1);
            var normalizedPageSize = Math.Clamp(pageSize, 1, MaxSongsPageSize);

            try
            {
                var validationError = await ValidateInputsAsync(code, year, cancellationToken);
                if (validationError != null)
                    return BadRequest(new { message = validationError });

                var normalizedCode = code.ToUpperInvariant();
                var cacheKey = BuildPresentationCacheKey("country-songs", normalizedCode, year, normalizedListType, normalizedPage, normalizedPageSize);
                var cached = await _presentationDataCache.GetAsync(cacheKey, cancellationToken);
                if (cached.HasValue)
                {
                    return Ok(cached.Value);
                }

                var result = await _repo.GetCountrySongsPageAsync(
                    normalizedCode,
                    year,
                    normalizedListType,
                    normalizedPage,
                    normalizedPageSize,
                    cancellationToken);
                BackgroundTaskLogger.LogFailure(_presentationDataCache.SaveAsync(cacheKey, result), _logger, cacheKey);
                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting country songs for {CountryCode} year {Year} listType {ListType}", code, year, listType);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving country songs data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting country songs for {CountryCode} year {Year} listType {ListType}", code, year, listType);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving country songs data." });
            }
        }

        /// <summary>
        /// Returns small live-resolved genre samples for one or more countries in a selected year.
        /// GET /api/country/genre-samples?year={year}&amp;codes=US,CA,JP
        /// </summary>
        [HttpGet("genre-samples")]
        public async Task<IActionResult> GetCountryGenreSamples(
            [FromQuery] int year = 2021,
            [FromQuery] string codes = "",
            CancellationToken cancellationToken = default)
        {
            var normalizedCodes = codes
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(value => value.ToUpperInvariant())
                .Where(value => CountryCodeRegex.IsMatch(value))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(MaxGenreSampleCodes)
                .ToList();

            if (normalizedCodes.Count == 0)
                return BadRequest(new { message = "At least one valid 2-letter country code is required." });

            try
            {
                if (!await IsAvailableYearAsync(year, cancellationToken))
                    return BadRequest(new { message = $"Year {year} is unavailable in this dataset." });

                var tasks = normalizedCodes.Select(async (countryCode) =>
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var cacheKey = $"country-genre-sample::{year}::{countryCode}";
                    return await _memoryCache.GetOrCreateAsync(cacheKey, async (entry) =>
                    {
                        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
                        var cachedGenres = await _discoverySampleCache.GetGenresAsync(countryCode, year, cancellationToken);
                        var genres = cachedGenres.Count > 0
                            ? cachedGenres
                            : await _repo.GetCountryGenreSampleAsync(countryCode, year, cancellationToken);
                        if (genres.Count > 0 && cachedGenres.Count == 0)
                            BackgroundTaskLogger.LogFailure(
                                _discoverySampleCache.SaveGenresAsync(countryCode, year, genres),
                                _logger,
                                $"genre sample {countryCode} {year}");
                        return new Capstone.API.Models.Country.CountryGenreSample
                        {
                            CountryCode = countryCode,
                            Genres = genres.ToList()
                        };
                    });
                });

                var results = (await Task.WhenAll(tasks))
                    .Where(sample => sample is not null)
                    .ToList();

                return Ok(results);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting country genre samples for year {Year} codes {Codes}", year, codes);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving country genre samples." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting country genre samples for year {Year} codes {Codes}", year, codes);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving country genre samples." });
            }
        }

        /// <summary>
        /// Returns small file-backed language samples for one or more countries in a selected year.
        /// GET /api/country/language-samples?year={year}&amp;codes=US,CA,JP
        /// </summary>
        [HttpGet("language-samples")]
        public async Task<IActionResult> GetCountryLanguageSamples(
            [FromQuery] int year = 2021,
            [FromQuery] string codes = "",
            CancellationToken cancellationToken = default)
        {
            var normalizedCodes = codes
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(value => value.ToUpperInvariant())
                .Where(value => CountryCodeRegex.IsMatch(value))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(MaxLanguageSampleCodes)
                .ToList();

            if (normalizedCodes.Count == 0)
                return BadRequest(new { message = "At least one valid 2-letter country code is required." });

            try
            {
                if (!await IsAvailableYearAsync(year, cancellationToken))
                    return BadRequest(new { message = $"Year {year} is unavailable in this dataset." });

                var tasks = normalizedCodes.Select(async (countryCode) =>
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var cacheKey = $"country-language-sample::{year}::{countryCode}";
                    return await _memoryCache.GetOrCreateAsync(cacheKey, async (entry) =>
                    {
                        entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
                        var cachedLanguages = await _discoverySampleCache.GetLanguagesAsync(countryCode, year, cancellationToken);
                        var languages = cachedLanguages.Count > 0
                            ? cachedLanguages
                            : await _repo.GetCountryLanguageSampleAsync(countryCode, year, cancellationToken);
                        if (languages.Count > 0 && cachedLanguages.Count == 0)
                            BackgroundTaskLogger.LogFailure(
                                _discoverySampleCache.SaveLanguagesAsync(countryCode, year, languages),
                                _logger,
                                $"language sample {countryCode} {year}");
                        return new Capstone.API.Models.Country.CountryLanguageSample
                        {
                            CountryCode = countryCode,
                            Languages = languages.ToList()
                        };
                    });
                });

                var results = (await Task.WhenAll(tasks))
                    .Where(sample => sample is not null)
                    .ToList();

                return Ok(results);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting country language samples for year {Year} codes {Codes}", year, codes);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving country language samples." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting country language samples for year {Year} codes {Codes}", year, codes);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving country language samples." });
            }
        }

        private async Task<string?> ValidateInputsAsync(string code, int year, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(code) || !CountryCodeRegex.IsMatch(code))
                return "Country code must be exactly 2 letters (ISO format, e.g. 'US').";

            if (!await IsAvailableYearAsync(year, cancellationToken))
                return $"Year {year} is unavailable in this dataset.";

            return null;
        }

        private async Task<bool> IsAvailableYearAsync(int year, CancellationToken cancellationToken = default)
        {
            var availableYears = await _memoryCache.GetOrCreateAsync(AvailableYearsCacheKey, async (entry) =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
                return (await _metadataRepo.GetAvailableYearsAsync(cancellationToken)).ToHashSet();
            }) ?? new HashSet<int>();
            return availableYears.Contains(year);
        }

        private static List<Capstone.API.Models.Country.FavoriteArtistSample> BuildFavoriteArtists(Capstone.API.Models.Country.CountryProfile profile)
        {
            var favoriteArtists = new List<Capstone.API.Models.Country.FavoriteArtistSample>(8);
            var seenArtists = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            void AddArtist(Capstone.API.Models.Shared.Song song)
            {
                var artist = song.ArtistName?.Trim();
                if (string.IsNullOrWhiteSpace(artist) || !seenArtists.Add(artist) || favoriteArtists.Count >= 8)
                {
                    return;
                }

                favoriteArtists.Add(new Capstone.API.Models.Country.FavoriteArtistSample
                {
                    Artist = artist,
                    SongTitle = song.SongName?.Trim() ?? string.Empty,
                    ArtistImageUrl = string.IsNullOrWhiteSpace(song.ArtistImageUrl) ? null : song.ArtistImageUrl.Trim()
                });
            }

            foreach (var song in profile.TopUniqueSongs)
            {
                AddArtist(song);
            }

            foreach (var song in profile.TopSharedSongs)
            {
                AddArtist(song);
            }

            return favoriteArtists;
        }

        private static string BuildPresentationCacheKey(string endpoint, params object[] parts)
        {
            return string.Join("::", new[] { endpoint }.Concat(parts.Select(part => part.ToString() ?? ""))).ToUpperInvariant();
        }
    }
}
