using Capstone.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;

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

        /// <summary>
        /// Initializes a new instance of HiddenGemsController.
        /// </summary>
        public HiddenGemsController(IHiddenGemsRepository repo)
        {
            _repo = repo;
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
            [FromQuery] int pageSize = 25)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 25;

            var result = await _repo.GetHiddenGemsAsync(code.ToUpper(), year, minCountries, page, pageSize);
            return Ok(result);
        }
    }
}
