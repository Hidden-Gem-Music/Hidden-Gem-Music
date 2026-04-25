using Capstone.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Capstone.API.Controllers
{
    /// <summary>
    /// Serves all data for the Global Overlap Dashboard — four KPI stat cards and their associated charts.
    /// All date parameters use ISO 8601 format (yyyy-MM-dd).
    /// </summary>
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardRepository _repo;

        /// <summary>
        /// Initializes a new instance of DashboardController.
        /// </summary>
        public DashboardController(IDashboardRepository repo)
        {
            _repo = repo;
        }

        /// <summary>
        /// Returns KPI 1 — global overlap rate stat card data.
        /// GET /api/dashboard/overlap-rate?start={date}&amp;end={date}
        /// </summary>
        [HttpGet("overlap-rate")]
        public async Task<IActionResult> GetOverlapRate(
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end)
        {
            var result = await _repo.GetOverlapRateAsync(start, end);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        /// <summary>
        /// Returns KPI 2 — average and median discovery gap in days.
        /// GET /api/dashboard/discovery-gap?start={date}&amp;end={date}&amp;minCountries={n}
        /// </summary>
        /// <param name="minCountries">Minimum countries a song must chart in to be included. Defaults to 2.</param>
        [HttpGet("discovery-gap")]
        public async Task<IActionResult> GetDiscoveryGap(
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end,
            [FromQuery] int minCountries = 2)
        {
            var result = await _repo.GetDiscoveryGapAsync(start, end, minCountries);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        /// <summary>
        /// Returns pre-bucketed histogram data for the Discovery Gap Distribution chart.
        /// Buckets: 0-7d, 8-14d, 15-30d, 31-60d, 61-90d, 90d+.
        /// GET /api/dashboard/gap-distribution?start={date}&amp;end={date}
        /// </summary>
        [HttpGet("gap-distribution")]
        public async Task<IActionResult> GetGapDistribution(
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end)
        {
            var result = await _repo.GetGapDistributionAsync(start, end);
            return Ok(result);
        }

        /// <summary>
        /// Returns KPI 3 — the single most globally isolated country for the stat card.
        /// GET /api/dashboard/isolation-leader?start={date}&amp;end={date}
        /// </summary>
        [HttpGet("isolation-leader")]
        public async Task<IActionResult> GetIsolationLeader(
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end)
        {
            var result = await _repo.GetIsolationLeaderAsync(start, end);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        /// <summary>
        /// Returns the full ranked isolation list for the Regional Isolation Scores bar chart.
        /// Fetched separately from the KPI card so both can load independently.
        /// GET /api/dashboard/isolation-ranking?start={date}&amp;end={date}
        /// </summary>
        [HttpGet("isolation-ranking")]
        public async Task<IActionResult> GetIsolationRanking(
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end)
        {
            var result = await _repo.GetIsolationRankingAsync(start, end);
            return Ok(result);
        }

        /// <summary>
        /// Returns KPI 4 — the song with the highest simultaneous cross-regional chart presence.
        /// Displayed as a Vinyl card component on the dashboard.
        /// GET /api/dashboard/peak-reach?start={date}&amp;end={date}
        /// </summary>
        [HttpGet("peak-reach")]
        public async Task<IActionResult> GetPeakReach(
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end)
        {
            var result = await _repo.GetPeakReachAsync(start, end);
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        /// <summary>
        /// Returns one data point per year (or month) for the Global Overlap trend and Global Reach charts.
        /// Each point includes IsGap to drive the 22-month data gap visual marker in Recharts.
        /// GET /api/dashboard/overlap-trend?start={date}&amp;end={date}
        /// </summary>
        [HttpGet("overlap-trend")]
        public async Task<IActionResult> GetOverlapTrend(
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end)
        {
            var result = await _repo.GetOverlapTrendAsync(start, end);
            return Ok(result);
        }
    }
}
