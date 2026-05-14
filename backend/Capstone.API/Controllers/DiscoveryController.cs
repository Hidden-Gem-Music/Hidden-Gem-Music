using Capstone.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Capstone.API.Controllers
{
    /// <summary>
    /// Serves shared country summary data for the Discovery experience.
    /// The globe and list consume this same payload and render it differently.
    /// </summary>
    [ApiController]
    [Route("api/discovery")]
    public class DiscoveryController : ControllerBase
    {
        private readonly IGlobeRepository _repo;
        private readonly IMetadataRepository _metadataRepo;
        private readonly ILogger<DiscoveryController> _logger;

        public DiscoveryController(
            IGlobeRepository repo,
            IMetadataRepository metadataRepo,
            ILogger<DiscoveryController> logger)
        {
            _repo = repo;
            _metadataRepo = metadataRepo;
            _logger = logger;
        }

        /// <summary>
        /// Returns one summary row per country for Discovery list + globe.
        /// GET /api/discovery/countries?year={year}
        /// </summary>
        [HttpGet("countries")]
        public async Task<IActionResult> GetDiscoveryCountries([FromQuery] int year = 2021, CancellationToken cancellationToken = default)
        {
            try
            {
                var availableYears = (await _metadataRepo.GetAvailableYearsAsync(cancellationToken)).ToHashSet();
                if (!availableYears.Contains(year))
                {
                    return BadRequest(new { message = $"Year {year} is unavailable in this dataset." });
                }

                var result = await _repo.GetGlobeSummaryAsync(year, cancellationToken);
                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting discovery countries for year {Year}", year);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving discovery countries data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting discovery countries for year {Year}", year);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving discovery countries data." });
            }
        }
    }
}
