using Capstone.API.Models.Globe;

namespace Capstone.API.Infrastructure.Interfaces
{
    /// <summary>
    /// Defines data access for the Discovery Globe screen.
    /// </summary>
    public interface IGlobeRepository
    {
        /// <summary>
        /// Returns one summary row per country for globe dot rendering and hover cards.
        /// Calls sp_GetGlobeSummary.
        /// </summary>
        /// <param name="year">The chart year to filter by.</param>
        Task<IEnumerable<CountryGlobeSummary>> GetGlobeSummaryAsync(int year);
    }
}
