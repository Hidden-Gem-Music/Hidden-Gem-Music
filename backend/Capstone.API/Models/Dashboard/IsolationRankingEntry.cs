namespace Capstone.API.Models.Dashboard
{
    /// <summary>
    /// Represents a single country's entry in the Regional Isolation Scores ranking.
    /// Used to populate the horizontal bar chart on the dashboard.
    /// Returned by sp_GetIsolationRanking.
    /// </summary>
    public class IsolationRankingEntry
    {
        /// <summary>
        /// Gets or sets the full display name of the country, used as the Y-axis label.
        /// </summary>
        public string? CountryName { get; set; }

        /// <summary>
        /// Gets or sets the 2-letter ISO code of the country.
        /// Used for navigation if the user clicks a bar.
        /// </summary>
        public string? IsoCode { get; set; }

        /// <summary>
        /// Gets or sets the isolation score as a percentage (0–100), used as the X-axis value.
        /// </summary>
        public decimal IsolationScore { get; set; }

        /// <summary>
        /// Gets or sets the isolation tier used for Recharts bar coloring.
        /// Values: "high" (&gt;65%), "mid" (40–65%), "low" (&lt;40%).
        /// </summary>
        public string? IsolationTier { get; set; }
    }
}
