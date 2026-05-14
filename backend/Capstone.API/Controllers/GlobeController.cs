using Capstone.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Capstone.API.Controllers
{
    /// <summary>
    /// Serves data for the Discovery Globe screen.
    /// </summary>
    [ApiController]
    [Route("api/globe")]
    public class GlobeController : ControllerBase
    {
        private readonly IGlobeRepository _repo;
        private readonly ILogger<GlobeController> _logger;

        /// <summary>
        /// Initializes a new instance of GlobeController.
        /// </summary>
        public GlobeController(IGlobeRepository repo, ILogger<GlobeController> logger)
        {
            _repo = repo;
            _logger = logger;
        }

        /// <summary>
        /// Returns one summary row per country for globe dot rendering and country hover cards.
        /// GET /api/globe?year={year}
        /// </summary>
        /// <param name="year">The chart year to display. Defaults to 2021 (last year of Dataset 1).</param>
        [HttpGet]
        public async Task<IActionResult> GetGlobeSummary([FromQuery] int year = 2021)
        {
            try
            {
                var result = await _repo.GetGlobeSummaryAsync(year);
                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting globe summary for year {Year}", year);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving globe data." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting globe summary for year {Year}", year);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving globe data." });
            }
        }
    }
}
