namespace Capstone.API.Models.Dashboard
{
    /// <summary>
    /// Represents KPI 1 — Global Overlap Rate.
    /// The percentage of all charting songs that appeared in 2 or more countries' charts.
    /// Returned by sp_GetGlobalOverlapRate.
    /// </summary>
    public class GlobalOverlapRateKpi
    {
        /// <summary>
        /// Gets or sets the percentage of charting songs that appeared in 2 or more countries.
        /// </summary>
        public decimal OverlapPct { get; set; }

        /// <summary>
        /// Gets or sets the total number of unique songs that charted across any country in the date range.
        /// </summary>
        public int TotalUniqueSongs { get; set; }

        /// <summary>
        /// Gets or sets the count of songs that charted in 2 or more countries.
        /// </summary>
        public int SongsIn2Plus { get; set; }
    }
}
