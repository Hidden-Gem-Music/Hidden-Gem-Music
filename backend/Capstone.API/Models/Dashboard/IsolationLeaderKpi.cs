namespace Capstone.API.Models.Dashboard
{
    /// <summary>
    /// Represents KPI 3 — Most Globally Isolated Region.
    /// Identifies the country with the highest percentage of locally unique charting songs.
    /// Returned by sp_GetIsolationLeader.
    /// </summary>
    public class IsolationLeaderKpi
    {
        /// <summary>
        /// Gets or sets the full display name of the most isolated country.
        /// </summary>
        public string? CountryName { get; set; }

        /// <summary>
        /// Gets or sets the 2-letter ISO code of the most isolated country.
        /// </summary>
        public string? IsoCode { get; set; }

        /// <summary>
        /// Gets or sets the isolation score as a percentage (0–100).
        /// Represents the share of that country's charting songs that appear nowhere else.
        /// </summary>
        public decimal IsolationScore { get; set; }
    }
}
