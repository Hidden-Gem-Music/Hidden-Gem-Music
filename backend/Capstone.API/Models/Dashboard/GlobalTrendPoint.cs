namespace Capstone.API.Models.Dashboard
{
    /// <summary>
    /// Represents one data point in the global overlap trend chart — one row per year or month.
    /// Feeds both the Global Overlap Rate Over Time line chart and the Global Reach Over Time bar chart.
    /// Returned by sp_GetGlobalOverlapTrend.
    /// </summary>
    public class GlobalTrendPoint
    {
        /// <summary>
        /// Gets or sets the human-readable period label used as the X-axis label (e.g. "2017", "2018").
        /// </summary>
        public string? PeriodLabel { get; set; }

        /// <summary>
        /// Gets or sets the year component of the period, used for sorting.
        /// </summary>
        public int PeriodYear { get; set; }

        /// <summary>
        /// Gets or sets the month component of the period.
        /// Null when using yearly granularity.
        /// </summary>
        public int? PeriodMonth { get; set; }

        /// <summary>
        /// Gets or sets the percentage of charting songs that appeared in 2 or more countries for this period.
        /// </summary>
        public decimal OverlapPct { get; set; }

        /// <summary>
        /// Gets or sets the average number of countries per charting song for this period.
        /// </summary>
        public decimal AvgCountries { get; set; }

        /// <summary>
        /// Gets or sets the total number of unique songs that charted in this period.
        /// </summary>
        public int TotalUniqueSongs { get; set; }

        /// <summary>
        /// Gets or sets the number of songs that charted in 2 or more countries in this period.
        /// </summary>
        public int SongsIn2Plus { get; set; }

        /// <summary>
        /// Gets or sets a flag indicating whether this point falls inside the 22-month data gap (Dec 2021 – Oct 2023).
        /// When true, Recharts renders a dashed line segment and ReferenceArea over this point.
        /// </summary>
        public bool IsGap { get; set; }
    }
}
