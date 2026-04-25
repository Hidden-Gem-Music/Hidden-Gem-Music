using Capstone.API.Models.Dashboard;

namespace Capstone.API.Infrastructure.Interfaces
{
    /// <summary>
    /// Defines data access for the Global Overlap Dashboard — all four KPI stat cards and their associated charts.
    /// </summary>
    public interface IDashboardRepository
    {
        /// <summary>
        /// Returns KPI 1 — the percentage of charting songs that appeared in 2+ countries.
        /// Calls sp_GetGlobalOverlapRate.
        /// </summary>
        Task<GlobalOverlapRateKpi?> GetOverlapRateAsync(DateOnly start, DateOnly end);

        /// <summary>
        /// Returns KPI 2 — average and median days before a song crosses into a second country.
        /// Calls sp_GetAverageDiscoveryGap.
        /// </summary>
        /// <param name="minCountries">Minimum countries a song must chart in to be included. Default is 2.</param>
        Task<DiscoveryGapKpi?> GetDiscoveryGapAsync(DateOnly start, DateOnly end, int minCountries = 2);

        /// <summary>
        /// Returns pre-bucketed histogram data for the Discovery Gap Distribution chart.
        /// Calls sp_GetDiscoveryGapDistribution. Buckets are computed in the DB, never in JavaScript.
        /// </summary>
        Task<IEnumerable<DiscoveryGapBucket>> GetGapDistributionAsync(DateOnly start, DateOnly end);

        /// <summary>
        /// Returns KPI 3 — the single most globally isolated country for the stat card.
        /// Calls sp_GetIsolationLeader.
        /// </summary>
        Task<IsolationLeaderKpi?> GetIsolationLeaderAsync(DateOnly start, DateOnly end);

        /// <summary>
        /// Returns the full ranked isolation list for the Regional Isolation Scores bar chart.
        /// Calls sp_GetIsolationRanking. Fetched separately from the KPI card so both can load independently.
        /// </summary>
        Task<IEnumerable<IsolationRankingEntry>> GetIsolationRankingAsync(DateOnly start, DateOnly end);

        /// <summary>
        /// Returns KPI 4 — the song with the highest simultaneous cross-regional chart presence.
        /// Calls sp_GetPeakCrossRegionalReach.
        /// </summary>
        Task<PeakReachKpi?> GetPeakReachAsync(DateOnly start, DateOnly end);

        /// <summary>
        /// Returns one data point per year (or month) for the Global Overlap trend and Reach charts.
        /// Includes IsGap to drive the 22-month data gap visual marker in Recharts.
        /// Calls sp_GetGlobalOverlapTrend.
        /// </summary>
        Task<IEnumerable<GlobalTrendPoint>> GetOverlapTrendAsync(DateOnly start, DateOnly end);
    }
}
