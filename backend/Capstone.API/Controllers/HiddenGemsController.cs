using Capstone.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Capstone.API.Controllers
{
    /// <summary>
    /// Serves paginated hidden gems data for the Hidden Songs Explorer screen.
    /// </summary>
    [ApiController]
    [Route("api/hidden-gems")]
    public class HiddenGemsController : ControllerBase
    {
        private readonly IHiddenGemsRepository _repo;
        private readonly IPresentationDataCacheService _presentationDataCache;
        private readonly ILogger<HiddenGemsController> _logger;

        /// <summary>
        /// Initializes a new instance of HiddenGemsController.
        /// </summary>
        public HiddenGemsController(
            IHiddenGemsRepository repo,
            IPresentationDataCacheService presentationDataCache,
            ILogger<HiddenGemsController> logger)
        {
            _repo = repo;
            _presentationDataCache = presentationDataCache;
            _logger = logger;
        }

        /// <summary>
        /// Returns a paginated list of hidden gems for a country — songs trending globally
        /// but absent from that country's charts.
        /// GET /api/hidden-gems/{code}?year={year}&amp;minCountries={n}&amp;page={p}&amp;pageSize={s}
        /// </summary>
        /// <param name="code">2-letter ISO country code.</param>
        /// <param name="year">The chart year to filter by. Defaults to 2021.</param>
        /// <param name="minCountries">Minimum number of other countries a song must chart in. Defaults to 2.</param>
        /// <param name="page">1-based page number. Defaults to 1.</param>
        /// <param name="pageSize">Results per page. Defaults to 25.</param>
        [HttpGet("{code}")]
        public async Task<IActionResult> GetHiddenGems(
            string code,
            [FromQuery] int year = 2021,
            [FromQuery] int minCountries = 2,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 25,
            CancellationToken cancellationToken = default)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 25;

            try
            {
                var normalizedCode = code.ToUpperInvariant();
                var cacheKey = BuildPresentationCacheKey("hidden-gems", normalizedCode, year, minCountries, page, pageSize);
                var cached = await _presentationDataCache.GetAsync(cacheKey, cancellationToken);
                if (cached.HasValue)
                {
                    return Ok(cached.Value);
                }

                var result = await _repo.GetHiddenGemsAsync(normalizedCode, year, minCountries, page, pageSize, cancellationToken);
                BackgroundTaskLogger.LogFailure(_presentationDataCache.SaveAsync(cacheKey, result), _logger, cacheKey);
                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting hidden gems for {CountryCode} year {Year}", code, year);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving hidden gems data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting hidden gems for {CountryCode} year {Year}", code, year);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving hidden gems data." });
            }
        }

        private static string BuildPresentationCacheKey(string endpoint, params object[] parts)
        {
            return string.Join("::", new[] { endpoint }.Concat(parts.Select(part => part.ToString() ?? ""))).ToUpperInvariant();
        }
    }
}
