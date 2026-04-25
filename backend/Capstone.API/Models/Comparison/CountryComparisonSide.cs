namespace Capstone.API.Models.Comparison
{
    /// <summary>
    /// Represents the chart statistics panel for one country in a side-by-side comparison.
    /// Used as CountryA and CountryB within ComparisonResult.
    /// </summary>
    public class CountryComparisonSide
    {
        /// <summary>
        /// Gets or sets the 2-letter ISO code of this country.
        /// </summary>
        public string? CountryCode { get; set; }

        /// <summary>
        /// Gets or sets the full display name of this country.
        /// </summary>
        public string? CountryName { get; set; }

        /// <summary>
        /// Gets or sets the total number of unique songs that charted in this country for the selected year.
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
        /// Gets or sets the overlap percentage for this country.
        /// </summary>
        public decimal OverlapPct { get; set; }
    }
}
