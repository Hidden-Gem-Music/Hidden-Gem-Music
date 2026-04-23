using Capstone.API.Models.Shared;

namespace Capstone.API.Models.Comparison
{
    /// <summary>
    /// Represents the full result of a country-vs-country comparison.
    /// Includes per-country KPI stats, songs shared by both, and each country's exclusive songs.
    /// Returned by sp_GetCountryComparison.
    /// </summary>
    public class ComparisonResult
    {
        /// <summary>
        /// Gets or sets the chart statistics for Country A.
        /// </summary>
        public CountryComparisonSide? CountryA { get; set; }

        /// <summary>
        /// Gets or sets the chart statistics for Country B.
        /// </summary>
        public CountryComparisonSide? CountryB { get; set; }

        /// <summary>
        /// Gets or sets the list of songs that charted in both countries,
        /// with each country's rank shown side by side.
        /// </summary>
        public List<SharedSong> SharedSongs { get; set; } = new();

        /// <summary>
        /// Gets or sets the list of songs that charted only in Country A.
        /// </summary>
        public List<Song> UniqueToA { get; set; } = new();

        /// <summary>
        /// Gets or sets the list of songs that charted only in Country B.
        /// </summary>
        public List<Song> UniqueToB { get; set; } = new();
    }
}
