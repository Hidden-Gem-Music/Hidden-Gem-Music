using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.Globe;

namespace Capstone.API.Infrastructure.Repositories
{
    /// <summary>
    /// Retrieves globe summary data by calling sp_GetGlobeSummary on the pre-computed summary tables.
    /// Never touches ChartEntry directly.
    /// </summary>
    public class GlobeRepository : IGlobeRepository
    {
        private readonly IDataRepository _db;

        /// <summary>
        /// Initializes a new instance of GlobeRepository using the default connection.
        /// </summary>
        public GlobeRepository(IDataRepositoryFactory factory)
        {
            _db = factory.Create("DefaultConnection");
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<CountryGlobeSummary>> GetGlobeSummaryAsync(int year)
        {
            var rows = await _db.GetDataAsync("sp_GetGlobeSummary", new Dictionary<string, object?>
            {
                { "@Year", year }
            });

            return rows.Select(MapRow);
        }

        private static CountryGlobeSummary MapRow(IDictionary<string, object?> row)
        {
            return new CountryGlobeSummary
            {
                CountryCode = AsString(row, "country_code"),
                CountryName = AsString(row, "country_name"),
                Lat = AsDouble(row, "lat"),
                Long = AsDouble(row, "long"),
                HiddenGemCount = AsInt(row, "hidden_gem_count"),
                TopAlbumName = AsString(row, "top_album_name")
            };
        }

        private static string? AsString(IDictionary<string, object?> row, string key)
            => row.TryGetValue(key, out var v) ? v?.ToString() : null;

        private static int AsInt(IDictionary<string, object?> row, string key)
            => row.TryGetValue(key, out var v) && v != null ? Convert.ToInt32(v) : 0;

        private static double AsDouble(IDictionary<string, object?> row, string key)
            => row.TryGetValue(key, out var v) && v != null ? Convert.ToDouble(v) : 0.0;
    }
}
