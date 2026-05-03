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
                CountryCode = RowValueReader.AsStringAny(row, "country_code"),
                CountryName = RowValueReader.AsStringAny(row, "country_name"),
                Region = RowValueReader.AsStringAny(row, "region"),
                Lat = RowValueReader.AsDoubleAny(row, "latitude"),
                Long = RowValueReader.AsDoubleAny(row, "longitude"),
                HiddenGemCount = RowValueReader.AsIntAny(row, "hidden_gem_count"),
                TopAlbumName = RowValueReader.AsStringAny(row, "top_album_name"),
                TopArtistName = RowValueReader.AsStringAny(row, "top_artist_name")
            };
        }
    }
}
