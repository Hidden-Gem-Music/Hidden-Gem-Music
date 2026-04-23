using Capstone.API.Models.HiddenGems;

namespace Capstone.API.Infrastructure.Interfaces
{
    /// <summary>
    /// Defines data access for the Hidden Gems screen.
    /// </summary>
    public interface IHiddenGemsRepository
    {
        /// <summary>
        /// Returns a paginated list of hidden gems for a country — songs trending globally
        /// but absent from that country's charts.
        /// Calls sp_GetHiddenGems.
        /// </summary>
        /// <param name="countryCode">2-letter ISO country code.</param>
        /// <param name="year">The chart year to filter by.</param>
        /// <param name="minCountries">Minimum number of other countries a song must chart in to qualify.</param>
        /// <param name="page">1-based page number.</param>
        /// <param name="pageSize">Maximum number of results per page.</param>
        Task<HiddenGemResponse> GetHiddenGemsAsync(string countryCode, int year, int minCountries, int page, int pageSize);
    }
}
