using Capstone.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Caching.Memory;

namespace Capstone.API.Controllers
{
    /// <summary>
    /// Serves shared metadata used by frontend controls.
    /// </summary>
    [ApiController]
    [Route("api/metadata")]
    public class MetadataController : ControllerBase
    {
        private const string AvailableYearsCacheKey = "metadata-controller-available-years";

        private readonly IMetadataRepository _repo;
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<MetadataController> _logger;

        /// <summary>
        /// Initializes a new instance of MetadataController.
        /// </summary>
        public MetadataController(IMetadataRepository repo, IMemoryCache memoryCache, ILogger<MetadataController> logger)
        {
            _repo = repo;
            _memoryCache = memoryCache;
            _logger = logger;
        }

        /// <summary>
        /// Returns available chart years that have data.
        /// GET /api/metadata/years
        /// </summary>
        [HttpGet("years")]
        public async Task<IActionResult> GetAvailableYears(CancellationToken cancellationToken = default)
        {
            try
            {
                var years = await _memoryCache.GetOrCreateAsync(AvailableYearsCacheKey, async entry =>
                {
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
                    return await _repo.GetAvailableYearsAsync(cancellationToken);
                });
                return Ok(years);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting available years");
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving available years." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available years");
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving available years." });
            }
        }
    }
}
