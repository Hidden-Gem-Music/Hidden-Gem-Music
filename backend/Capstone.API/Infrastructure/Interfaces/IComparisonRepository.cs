using Capstone.API.Models.Comparison;

namespace Capstone.API.Infrastructure.Interfaces
{
    /// <summary>
    /// Defines data access for the Country Comparison screen.
    /// </summary>
    public interface IComparisonRepository
    {
        /// <summary>
        /// Returns side-by-side chart statistics, shared songs, and exclusive songs for two countries.
        /// Calls sp_GetCountryComparison.
        /// </summary>
        /// <param name="countryCodeA">2-letter ISO code for Country A.</param>
        /// <param name="countryCodeB">2-letter ISO code for Country B.</param>
        /// <param name="year">The chart year to filter by.</param>
        Task<ComparisonResult?> GetCountryComparisonAsync(string countryCodeA, string countryCodeB, int year);

        /// <summary>
        /// Returns songs trending in surrounding regions that are absent from both compared countries.
        /// Calls sp_GetComparisonHiddenGems.
        /// </summary>
        /// <param name="countryCodeA">2-letter ISO code for Country A.</param>
        /// <param name="countryCodeB">2-letter ISO code for Country B.</param>
        /// <param name="year">The chart year to filter by.</param>
        Task<IEnumerable<ComparisonHiddenGem>> GetComparisonHiddenGemsAsync(string countryCodeA, string countryCodeB, int year);
    }
}
