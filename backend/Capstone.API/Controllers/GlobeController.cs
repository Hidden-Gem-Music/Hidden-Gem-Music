using Capstone.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;

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

        /// <summary>
        /// Initializes a new instance of GlobeController.
        /// </summary>
        public GlobeController(IGlobeRepository repo)
        {
            _repo = repo;
        }

        /// <summary>
        /// Returns one summary row per country for globe dot rendering and country hover cards.
        /// GET /api/globe?year={year}
        /// </summary>
        /// <param name="year">The chart year to display. Defaults to 2021 (last year of Dataset 1).</param>
        [HttpGet]
        public async Task<IActionResult> GetGlobeSummary([FromQuery] int year = 2021)
        {
            var result = await _repo.GetGlobeSummaryAsync(year);
            return Ok(result);
        }
    }
}
