using Capstone.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;

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

        public DiscoveryController(IGlobeRepository repo)
        {
            _repo = repo;
        }

        /// <summary>
        /// Returns one summary row per country for Discovery list + globe.
        /// GET /api/discovery/countries?year={year}
        /// </summary>
        [HttpGet("countries")]
        public async Task<IActionResult> GetDiscoveryCountries([FromQuery] int year = 2021)
        {
            var result = await _repo.GetGlobeSummaryAsync(year);
            return Ok(result);
        }
    }
}
