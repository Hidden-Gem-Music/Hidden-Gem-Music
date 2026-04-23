using Capstone.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Capstone.API.Controllers
{
    /// <summary>
    /// Serves data for the Country Comparison screen.
    /// </summary>
    [ApiController]
    [Route("api/comparison")]
    public class ComparisonController : ControllerBase
    {
        private readonly IComparisonRepository _repo;

        /// <summary>
        /// Initializes a new instance of ComparisonController.
        /// </summary>
        public ComparisonController(IComparisonRepository repo)
        {
            _repo = repo;
        }

        /// <summary>
        /// Returns side-by-side chart statistics, shared songs, and exclusive song lists for two countries.
        /// GET /api/comparison?countryA={code}&amp;countryB={code}&amp;year={year}
        /// </summary>
        /// <param name="countryA">2-letter ISO code for Country A.</param>
        /// <param name="countryB">2-letter ISO code for Country B.</param>
        /// <param name="year">The chart year to compare. Defaults to 2021.</param>
        [HttpGet]
        public async Task<IActionResult> GetCountryComparison(
            [FromQuery] string countryA,
            [FromQuery] string countryB,
            [FromQuery] int year = 2021)
        {
            var result = await _repo.GetCountryComparisonAsync(countryA.ToUpper(), countryB.ToUpper(), year);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        /// <summary>
        /// Returns songs trending in surrounding regions that are absent from both compared countries.
        /// GET /api/comparison/hidden-gems?countryA={code}&amp;countryB={code}&amp;year={year}
        /// </summary>
        /// <param name="countryA">2-letter ISO code for Country A.</param>
        /// <param name="countryB">2-letter ISO code for Country B.</param>
        /// <param name="year">The chart year to filter by. Defaults to 2021.</param>
        [HttpGet("hidden-gems")]
        public async Task<IActionResult> GetComparisonHiddenGems(
            [FromQuery] string countryA,
            [FromQuery] string countryB,
            [FromQuery] int year = 2021)
        {
            var result = await _repo.GetComparisonHiddenGemsAsync(countryA.ToUpper(), countryB.ToUpper(), year);
            return Ok(result);
        }
    }
}
