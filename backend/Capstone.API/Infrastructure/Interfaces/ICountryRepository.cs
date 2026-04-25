using Capstone.API.Models.Country;
using Capstone.API.Models.HiddenGems;

namespace Capstone.API.Infrastructure.Interfaces
{
    /// <summary>
    /// Defines data access for the Country Profile screen.
    /// </summary>
    public interface ICountryRepository
    {
        /// <summary>
        /// Returns full chart statistics and top song lists for a single country and year.
        /// Calls sp_GetCountryProfile.
        /// </summary>
        /// <param name="countryCode">2-letter ISO country code.</param>
        /// <param name="year">The chart year to filter by.</param>
        Task<CountryProfile?> GetCountryProfileAsync(string countryCode, int year);

        /// <summary>
        /// Returns the top 5 hidden gems for the teaser widget on the country page.
        /// Calls sp_GetCountryHiddenGemsPreview.
        /// </summary>
        /// <param name="countryCode">2-letter ISO country code.</param>
        /// <param name="year">The chart year to filter by.</param>
        Task<IEnumerable<HiddenGem>> GetHiddenGemsPreviewAsync(string countryCode, int year);
    }
}
