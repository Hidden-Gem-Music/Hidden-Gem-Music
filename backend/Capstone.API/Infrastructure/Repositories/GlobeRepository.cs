using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.Globe;

namespace Capstone.API.Infrastructure.Repositories
{
    /// <summary>
    /// Retrieves discovery country data by calling sp_GetDiscoverPageInfo on the pre-computed summary tables.
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
            var rows = await _db.GetDataAsync("sp_GetDiscoverPageInfo", new Dictionary<string, object?>
            {
                { "@Year", year }
            });

            return rows.Select(MapRow);
        }

        private static CountryGlobeSummary MapRow(IDictionary<string, object?> row)
        {
            return new CountryGlobeSummary
            {
                CountryCode = AsStringAny(row, "country_code", "countryCode", "CountryCode", "iso_code"),
                CountryName = AsStringAny(row, "country_name", "countryName", "CountryName", "full_name"),
                Region = AsStringAny(row, "region", "Region"),
                Lat = AsDoubleAny(row, "latitude", "lat", "Latitude", "Lat"),
                Long = AsDoubleAny(row, "longitude", "long", "Longitude", "Long"),
                HiddenGemCount = AsIntAny(row, "hidden_gem_count", "hiddenGemCount", "HiddenGemCount"),
                TopAlbumName = AsStringAny(row, "top_album_name", "topAlbumName", "TopAlbumName"),
                TopArtistName = AsStringAny(row, "top_artist_name", "topArtistName", "TopArtistName")
            };
        }

        private static string? AsStringAny(IDictionary<string, object?> row, params string[] keys)
        {
            foreach (var key in keys)
            {
                if (row.TryGetValue(key, out var v) && v != null)
                    return v.ToString();
            }

            return null;
        }

        private static int AsIntAny(IDictionary<string, object?> row, params string[] keys)
        {
            foreach (var key in keys)
            {
                if (row.TryGetValue(key, out var v) && v != null)
                    return Convert.ToInt32(v);
            }

            return 0;
        }

        private static double AsDoubleAny(IDictionary<string, object?> row, params string[] keys)
        {
            foreach (var key in keys)
            {
                if (row.TryGetValue(key, out var v) && v != null)
                    return Convert.ToDouble(v);
            }

            return 0.0;
        }
    }
}
