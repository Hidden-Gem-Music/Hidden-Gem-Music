using Capstone.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace Capstone.API.Controllers
{
    /// <summary>
    /// Serves data for the Country Comparison screen.
    /// </summary>
    [ApiController]
    [Route("api/comparison")]
    public class ComparisonController : ControllerBase
    {
        private static readonly Regex CountryCodeRegex = new("^[A-Za-z]{2}$", RegexOptions.Compiled);
        private const int MinSupportedYear = 1975;
        private const int MaxSupportedYear = 2021;
        private const int UnavailableGapStartYear = 2007;
        private const int UnavailableGapEndYear = 2010;

        private readonly IComparisonRepository _repo;
        private readonly ILogger<ComparisonController> _logger;

        /// <summary>
        /// Initializes a new instance of ComparisonController.
        /// </summary>
        public ComparisonController(IComparisonRepository repo, ILogger<ComparisonController> logger)
        {
            _repo = repo;
            _logger = logger;
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
            [FromQuery] int year = 2021,
            CancellationToken cancellationToken = default)
        {
            if (!TryValidateInputs(countryA, countryB, year, out var validationError))
                return BadRequest(new { message = validationError });

            try
            {
                var result = await _repo.GetCountryComparisonAsync(
                    countryA.ToUpperInvariant(),
                    countryB.ToUpperInvariant(),
                    year,
                    cancellationToken);

                if (result == null)
                    return NotFound();

                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(
                    ex,
                    "SQL error getting country comparison for {CountryA} vs {CountryB} year {Year}",
                    countryA,
                    countryB,
                    year);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving country comparison data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error getting country comparison for {CountryA} vs {CountryB} year {Year}",
                    countryA,
                    countryB,
                    year);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving country comparison data." });
            }
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
            [FromQuery] int year = 2021,
            CancellationToken cancellationToken = default)
        {
            if (!TryValidateInputs(countryA, countryB, year, out var validationError))
                return BadRequest(new { message = validationError });

            try
            {
                var result = await _repo.GetComparisonHiddenGemsAsync(
                    countryA.ToUpperInvariant(),
                    countryB.ToUpperInvariant(),
                    year,
                    cancellationToken);
                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(
                    ex,
                    "SQL error getting comparison hidden gems for {CountryA} vs {CountryB} year {Year}",
                    countryA,
                    countryB,
                    year);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving comparison hidden gems data." });
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return new EmptyResult();
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error getting comparison hidden gems for {CountryA} vs {CountryB} year {Year}",
                    countryA,
                    countryB,
                    year);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving comparison hidden gems data." });
            }
        }

        private static bool TryValidateInputs(string countryA, string countryB, int year, out string validationError)
        {
            if (string.IsNullOrWhiteSpace(countryA) || !CountryCodeRegex.IsMatch(countryA))
            {
                validationError = "countryA must be exactly 2 letters (ISO format, e.g. 'US').";
                return false;
            }

            if (string.IsNullOrWhiteSpace(countryB) || !CountryCodeRegex.IsMatch(countryB))
            {
                validationError = "countryB must be exactly 2 letters (ISO format, e.g. 'GB').";
                return false;
            }

            if (countryA.Equals(countryB, StringComparison.OrdinalIgnoreCase))
            {
                validationError = "countryA and countryB must be different countries.";
                return false;
            }

            if (year < MinSupportedYear || year > MaxSupportedYear)
            {
                validationError = $"Year must be between {MinSupportedYear} and {MaxSupportedYear}.";
                return false;
            }

            if (year >= UnavailableGapStartYear && year <= UnavailableGapEndYear)
            {
                validationError = $"Year {year} is unavailable in this dataset window.";
                return false;
            }

            validationError = string.Empty;
            return true;
        }
    }
}
