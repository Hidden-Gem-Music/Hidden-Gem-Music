using Capstone.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Capstone.API.Controllers
{
    /// <summary>
    /// Serves data for the Country Profile screen.
    /// </summary>
    [ApiController]
    [Route("api/country")]
    public class CountryController : ControllerBase
    {
        private readonly ICountryRepository _repo;

        /// <summary>
        /// Initializes a new instance of CountryController.
        /// </summary>
        public CountryController(ICountryRepository repo)
        {
            _repo = repo;
        }

        /// <summary>
        /// Returns full chart statistics and top song lists for a single country and year.
        /// GET /api/country/{code}?year={year}
        /// </summary>
        /// <param name="code">2-letter ISO country code (e.g. "US", "JP").</param>
        /// <param name="year">The chart year to display. Defaults to 2021.</param>
        [HttpGet("{code}")]
        public async Task<IActionResult> GetCountryProfile(string code, [FromQuery] int year = 2021)
        {
            var result = await _repo.GetCountryProfileAsync(code.ToUpper(), year);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        /// <summary>
        /// Returns the top 5 hidden gems for the teaser widget on the country profile page.
        /// GET /api/country/{code}/hidden-gems/preview?year={year}
        /// </summary>
        /// <param name="code">2-letter ISO country code.</param>
        /// <param name="year">The chart year to display. Defaults to 2021.</param>
        [HttpGet("{code}/hidden-gems/preview")]
        public async Task<IActionResult> GetHiddenGemsPreview(string code, [FromQuery] int year = 2021)
        {
            var result = await _repo.GetHiddenGemsPreviewAsync(code.ToUpper(), year);
            return Ok(result);
        }
    }
}
