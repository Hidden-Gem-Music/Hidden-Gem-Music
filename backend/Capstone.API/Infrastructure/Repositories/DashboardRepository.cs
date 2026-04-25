using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.Dashboard;

namespace Capstone.API.Infrastructure.Repositories
{
    /// <summary>
    /// Retrieves all Global Overlap Dashboard data — four KPI stat cards and their associated charts.
    /// Every method calls a dedicated read stored procedure against pre-computed summary tables.
    /// </summary>
    public class DashboardRepository : IDashboardRepository
    {
        private readonly IDataRepository _db;

        /// <summary>
        /// Initializes a new instance of DashboardRepository using the default connection.
        /// </summary>
        public DashboardRepository(IDataRepositoryFactory factory)
        {
            _db = factory.Create("DefaultConnection");
        }

        /// <inheritdoc/>
        public async Task<GlobalOverlapRateKpi?> GetOverlapRateAsync(DateOnly start, DateOnly end)
        {
            var rows = await _db.GetDataAsync("sp_GetGlobalOverlapRate", DateRange(start, end));
            var row = rows.FirstOrDefault();
            if (row == null) return null;

            return new GlobalOverlapRateKpi
            {
                OverlapPct = AsDecimal(row, "overlap_pct"),
                TotalUniqueSongs = AsInt(row, "total_unique_songs"),
                SongsIn2Plus = AsInt(row, "songs_in_2plus")
            };
        }

        /// <inheritdoc/>
        public async Task<DiscoveryGapKpi?> GetDiscoveryGapAsync(DateOnly start, DateOnly end, int minCountries = 2)
        {
            var rows = await _db.GetDataAsync("sp_GetAverageDiscoveryGap", new Dictionary<string, object?>
            {
                { "@DateStart", start.ToDateTime(TimeOnly.MinValue) },
                { "@DateEnd", end.ToDateTime(TimeOnly.MinValue) },
                { "@MinCountries", minCountries }
            });

            var row = rows.FirstOrDefault();
            if (row == null) return null;

            return new DiscoveryGapKpi
            {
                AvgGapDays = AsInt(row, "avg_gap_days"),
                MedianGapDays = AsInt(row, "median_gap_days"),
                SampleSize = AsInt(row, "sample_size")
            };
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<DiscoveryGapBucket>> GetGapDistributionAsync(DateOnly start, DateOnly end)
        {
            var rows = await _db.GetDataAsync("sp_GetDiscoveryGapDistribution", DateRange(start, end));

            return rows.Select(row => new DiscoveryGapBucket
            {
                BucketLabel = AsString(row, "bucket_label"),
                BucketOrder = AsInt(row, "bucket_order"),
                SongCount = AsInt(row, "song_count")
            });
        }

        /// <inheritdoc/>
        public async Task<IsolationLeaderKpi?> GetIsolationLeaderAsync(DateOnly start, DateOnly end)
        {
            var rows = await _db.GetDataAsync("sp_GetIsolationLeader", DateRange(start, end));
            var row = rows.FirstOrDefault();
            if (row == null) return null;

            return new IsolationLeaderKpi
            {
                CountryName = AsString(row, "country_name"),
                IsoCode = AsString(row, "iso_code"),
                IsolationScore = AsDecimal(row, "isolation_score")
            };
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<IsolationRankingEntry>> GetIsolationRankingAsync(DateOnly start, DateOnly end)
        {
            var rows = await _db.GetDataAsync("sp_GetIsolationRanking", DateRange(start, end));

            return rows.Select(row => new IsolationRankingEntry
            {
                CountryName = AsString(row, "country_name"),
                IsoCode = AsString(row, "iso_code"),
                IsolationScore = AsDecimal(row, "isolation_score"),
                IsolationTier = AsString(row, "isolation_tier")
            });
        }

        /// <inheritdoc/>
        public async Task<PeakReachKpi?> GetPeakReachAsync(DateOnly start, DateOnly end)
        {
            var rows = await _db.GetDataAsync("sp_GetPeakCrossRegionalReach", DateRange(start, end));
            var row = rows.FirstOrDefault();
            if (row == null) return null;

            return new PeakReachKpi
            {
                PeakCountryCount = AsInt(row, "peak_country_count"),
                SongTitle = AsString(row, "song_title"),
                ArtistName = AsString(row, "artist_name"),
                PeakDate = AsDateOnly(row, "peak_date")
            };
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<GlobalTrendPoint>> GetOverlapTrendAsync(DateOnly start, DateOnly end)
        {
            var rows = await _db.GetDataAsync("sp_GetGlobalOverlapTrend", DateRange(start, end));

            return rows.Select(row => new GlobalTrendPoint
            {
                PeriodLabel = AsString(row, "period_label"),
                PeriodYear = AsInt(row, "period_year"),
                PeriodMonth = AsNullableInt(row, "period_month"),
                OverlapPct = AsDecimal(row, "overlap_pct"),
                AvgCountries = AsDecimal(row, "avg_countries"),
                TotalUniqueSongs = AsInt(row, "total_unique_songs"),
                SongsIn2Plus = AsInt(row, "songs_in_2plus"),
                IsGap = AsBool(row, "is_gap")
            });
        }

        // Builds the standard date-range parameter dictionary used by most dashboard SPs.
        private static Dictionary<string, object?> DateRange(DateOnly start, DateOnly end)
        {
            return new Dictionary<string, object?>
            {
                { "@DateStart", start.ToDateTime(TimeOnly.MinValue) },
                { "@DateEnd", end.ToDateTime(TimeOnly.MinValue) }
            };
        }

        private static string? AsString(IDictionary<string, object?> row, string key)
            => row.TryGetValue(key, out var v) ? v?.ToString() : null;

        private static int AsInt(IDictionary<string, object?> row, string key)
            => row.TryGetValue(key, out var v) && v != null ? Convert.ToInt32(v) : 0;

        private static int? AsNullableInt(IDictionary<string, object?> row, string key)
            => row.TryGetValue(key, out var v) && v != null ? Convert.ToInt32(v) : null;

        private static decimal AsDecimal(IDictionary<string, object?> row, string key)
            => row.TryGetValue(key, out var v) && v != null ? Convert.ToDecimal(v) : 0m;

        private static bool AsBool(IDictionary<string, object?> row, string key)
            => row.TryGetValue(key, out var v) && v != null && Convert.ToBoolean(v);

        private static DateOnly AsDateOnly(IDictionary<string, object?> row, string key)
            => row.TryGetValue(key, out var v) && v is DateTime dt ? DateOnly.FromDateTime(dt) : DateOnly.MinValue;
    }
}
