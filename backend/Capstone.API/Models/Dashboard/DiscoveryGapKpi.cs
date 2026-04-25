namespace Capstone.API.Models.Dashboard
{
    /// <summary>
    /// Represents KPI 2 — Average Discovery Gap.
    /// Measures how many days pass before a song that charted in one country appears in a second country.
    /// Returned by sp_GetAverageDiscoveryGap.
    /// </summary>
    public class DiscoveryGapKpi
    {
        /// <summary>
        /// Gets or sets the mean discovery gap in days across all qualifying songs.
        /// </summary>
        public int AvgGapDays { get; set; }

        /// <summary>
        /// Gets or sets the median discovery gap in days.
        /// Displayed alongside the average because outliers significantly skew the mean.
        /// </summary>
        public int MedianGapDays { get; set; }

        /// <summary>
        /// Gets or sets the number of songs included in the calculation.
        /// Only songs that charted in 2 or more countries are counted.
        /// </summary>
        public int SampleSize { get; set; }
    }
}
