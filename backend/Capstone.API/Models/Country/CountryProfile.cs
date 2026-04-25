using Capstone.API.Models.Shared;

namespace Capstone.API.Models.Country
{
    /// <summary>
    /// Represents the full profile for a single country, including chart statistics
    /// and top song lists for the selected year.
    /// Returned by sp_GetCountryProfile.
    /// </summary>
    public class CountryProfile
    {
        /// <summary>
        /// Gets or sets the 2-letter ISO code of the country.
        /// </summary>
        public string? CountryCode { get; set; }

        /// <summary>
        /// Gets or sets the full display name of the country.
        /// </summary>
        public string? CountryName { get; set; }

        /// <summary>
        /// Gets or sets the year this profile data applies to.
        /// </summary>
        public int Year { get; set; }

        /// <summary>
        /// Gets or sets the total number of unique songs that charted in this country for the year.
        /// </summary>
        public int TotalCharted { get; set; }

        /// <summary>
        /// Gets or sets the number of songs this country shares with at least one other country's charts.
        /// </summary>
        public int SharedCount { get; set; }

        /// <summary>
        /// Gets or sets the number of songs that charted only in this country.
        /// </summary>
        public int UniqueCount { get; set; }

        /// <summary>
        /// Gets or sets the overlap percentage — the share of this country's charting songs
        /// that also appeared in at least one other country.
        /// </summary>
        public decimal OverlapPct { get; set; }

        /// <summary>
        /// Gets or sets the top songs this country shares with other charts.
        /// </summary>
        public List<Song> TopSharedSongs { get; set; } = new();

        /// <summary>
        /// Gets or sets the top songs unique to this country's charts.
        /// </summary>
        public List<Song> TopUniqueSongs { get; set; } = new();
    }
}
