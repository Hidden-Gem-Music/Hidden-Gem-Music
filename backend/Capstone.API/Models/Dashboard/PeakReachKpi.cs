namespace Capstone.API.Models.Dashboard
{
    /// <summary>
    /// Represents KPI 4 — Peak Cross-Regional Reach.
    /// The highest number of countries a single song simultaneously charted in at any point in the dataset.
    /// Displayed as a Vinyl card component on the dashboard.
    /// Returned by sp_GetPeakCrossRegionalReach.
    /// </summary>
    public class PeakReachKpi
    {
        /// <summary>
        /// Gets or sets the maximum number of countries this song charted in simultaneously.
        /// </summary>
        public int PeakCountryCount { get; set; }

        /// <summary>
        /// Gets or sets the title of the song that achieved peak cross-regional reach.
        /// </summary>
        public string? SongTitle { get; set; }

        /// <summary>
        /// Gets or sets the name of the primary artist of the song.
        /// </summary>
        public string? ArtistName { get; set; }

        /// <summary>
        /// Gets or sets the date on which peak reach was recorded.
        /// </summary>
        public DateOnly PeakDate { get; set; }
    }
}
