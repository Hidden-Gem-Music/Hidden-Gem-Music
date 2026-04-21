namespace Capstone.API.Models.Dashboard
{
    /// <summary>
    /// Represents one bar in the Discovery Gap Distribution histogram.
    /// Buckets are pre-computed at population time by sp_PopulateDiscoveryGapByDay — never bucketed in JavaScript.
    /// Returned by sp_GetDiscoveryGapDistribution.
    /// </summary>
    public class DiscoveryGapBucket
    {
        /// <summary>
        /// Gets or sets the display label for this bucket (e.g. "0-7d", "8-14d", "15-30d", "31-60d", "61-90d", "90d+").
        /// </summary>
        public string? BucketLabel { get; set; }

        /// <summary>
        /// Gets or sets the sort order for this bucket (1–6), ensuring correct left-to-right histogram ordering.
        /// </summary>
        public int BucketOrder { get; set; }

        /// <summary>
        /// Gets or sets the number of songs whose discovery gap falls within this bucket.
        /// </summary>
        public int SongCount { get; set; }
    }
}
