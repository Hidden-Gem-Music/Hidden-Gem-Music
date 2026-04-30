using Capstone.API.Infrastructure.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace Capstone.API.Controllers
{
    /// <summary>
    /// Serves data for the Country Profile screen.
    /// </summary>
    [ApiController]
    [Route("api/country")]
    public class CountryController : ControllerBase
    {
        private static readonly Regex CountryCodeRegex = new("^[A-Za-z]{2}$", RegexOptions.Compiled);

        // Keep backend year validation aligned with frontend selectable years.
        private const int MinSupportedYear = 1975;
        private const int MaxSupportedYear = 2021;
        private const int UnavailableGapStartYear = 2007;
        private const int UnavailableGapEndYear = 2010;

        private readonly ICountryRepository _repo;
        private readonly ILogger<CountryController> _logger;

        /// <summary>
        /// Initializes a new instance of CountryController.
        /// </summary>
        public CountryController(ICountryRepository repo, ILogger<CountryController> logger)
        {
            _repo = repo;
            _logger = logger;
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
            if (!TryValidateInputs(code, year, out var validationError))
                return BadRequest(new { message = validationError });

            try
            {
                var normalizedCode = code.ToUpperInvariant();
                var result = await _repo.GetCountryProfileAsync(normalizedCode, year);
                if (result == null)
                    return NotFound();

                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting country profile for {CountryCode} year {Year}", code, year);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving country profile data." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting country profile for {CountryCode} year {Year}", code, year);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving country profile data." });
            }
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
            if (!TryValidateInputs(code, year, out var validationError))
                return BadRequest(new { message = validationError });

            try
            {
                var normalizedCode = code.ToUpperInvariant();
                var result = await _repo.GetHiddenGemsPreviewAsync(normalizedCode, year);
                return Ok(result);
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error getting hidden gems preview for {CountryCode} year {Year}", code, year);
                return StatusCode(503, new { message = "Database temporarily unavailable while retrieving hidden gems preview data." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting hidden gems preview for {CountryCode} year {Year}", code, year);
                return StatusCode(500, new { message = "An unexpected error occurred while retrieving hidden gems preview data." });
            }
        }

        private static bool TryValidateInputs(string code, int year, out string validationError)
        {
            if (string.IsNullOrWhiteSpace(code) || !CountryCodeRegex.IsMatch(code))
            {
                validationError = "Country code must be exactly 2 letters (ISO format, e.g. 'US').";
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
