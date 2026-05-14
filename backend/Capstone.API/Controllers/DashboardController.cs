using Capstone.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

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
        private readonly ILogger<DashboardController> _logger;

        /// <summary>
        /// Initializes a new instance of DashboardController.
        /// </summary>
        public DashboardController(IDashboardRepository repo, ILogger<DashboardController> logger)
        {
            _repo = repo;
            _logger = logger;
        }

        /// <summary>
        /// Returns KPI 1 — global overlap rate stat card data.
        /// GET /api/dashboard/overlap-rate?start={date}&amp;end={date}
        /// </summary>
        [HttpGet("overlap-rate")]
        public async Task<IActionResult> GetOverlapRate(
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _repo.GetOverlapRateAsync(start, end, cancellationToken);
                if (result == null)
                    return NotFound();

                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting overlap rate for {Start} to {End}", start, end);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving global overlap rate data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting overlap rate for {Start} to {End}", start, end);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving global overlap rate data." });
            }
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
            [FromQuery] int minCountries = 2,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _repo.GetDiscoveryGapAsync(start, end, minCountries, cancellationToken);
                if (result == null)
                    return NotFound();

                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting discovery gap for {Start} to {End}", start, end);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving discovery gap data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting discovery gap for {Start} to {End}", start, end);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving discovery gap data." });
            }
        }

        /// <summary>
        /// Returns pre-bucketed histogram data for the Discovery Gap Distribution chart.
        /// Buckets: 1-7d, 8-14d, 15-30d, 31-60d, 61-90d, 90d+.
        /// GET /api/dashboard/gap-distribution?start={date}&amp;end={date}
        /// </summary>
        [HttpGet("gap-distribution")]
        public async Task<IActionResult> GetGapDistribution(
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _repo.GetGapDistributionAsync(start, end, cancellationToken);
                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting gap distribution for {Start} to {End}", start, end);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving discovery gap distribution data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting gap distribution for {Start} to {End}", start, end);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving discovery gap distribution data." });
            }
        }

        /// <summary>
        /// Returns KPI 3 — the single most globally isolated country for the stat card.
        /// GET /api/dashboard/isolation-leader?start={date}&amp;end={date}
        /// </summary>
        [HttpGet("isolation-leader")]
        public async Task<IActionResult> GetIsolationLeader(
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _repo.GetIsolationLeaderAsync(start, end, cancellationToken);
                if (result == null)
                    return NotFound();

                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting isolation leader for {Start} to {End}", start, end);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving isolation leader data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting isolation leader for {Start} to {End}", start, end);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving isolation leader data." });
            }
        }

        /// <summary>
        /// Returns the full ranked isolation list for the Regional Isolation Scores bar chart.
        /// Fetched separately from the KPI card so both can load independently.
        /// GET /api/dashboard/isolation-ranking?start={date}&amp;end={date}
        /// </summary>
        [HttpGet("isolation-ranking")]
        public async Task<IActionResult> GetIsolationRanking(
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _repo.GetIsolationRankingAsync(start, end, cancellationToken);
                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting isolation ranking for {Start} to {End}", start, end);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving isolation ranking data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting isolation ranking for {Start} to {End}", start, end);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving isolation ranking data." });
            }
        }

        /// <summary>
        /// Returns KPI 4 — the song with the highest simultaneous cross-regional chart presence.
        /// Displayed as a Vinyl card component on the dashboard.
        /// GET /api/dashboard/peak-reach?start={date}&amp;end={date}
        /// </summary>
        [HttpGet("peak-reach")]
        public async Task<IActionResult> GetPeakReach(
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _repo.GetPeakReachAsync(start, end, cancellationToken);
                if (result == null)
                    return NotFound();

                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting peak reach for {Start} to {End}", start, end);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving peak reach data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting peak reach for {Start} to {End}", start, end);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving peak reach data." });
            }
        }

        /// <summary>
        /// Returns one data point per year (or month) for the Global Overlap trend and Global Reach charts.
        /// Each point includes IsGap to drive the 22-month data gap visual marker in Recharts.
        /// GET /api/dashboard/overlap-trend?start={date}&amp;end={date}
        /// </summary>
        [HttpGet("overlap-trend")]
        public async Task<IActionResult> GetOverlapTrend(
            [FromQuery] DateOnly start,
            [FromQuery] DateOnly end,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var result = await _repo.GetOverlapTrendAsync(start, end, cancellationToken);
                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting overlap trend for {Start} to {End}", start, end);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving global overlap trend data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting overlap trend for {Start} to {End}", start, end);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving global overlap trend data." });
            }
        }
    }
}
