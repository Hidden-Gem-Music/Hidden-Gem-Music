using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.HiddenGems;

namespace Capstone.API.Infrastructure.Repositories
{
    /// <summary>
    /// Retrieves paginated hidden gems by calling sp_GetHiddenGems.
    /// Pagination is handled entirely in the stored procedure via @Offset and @PageSize —
    /// never in application code.
    /// </summary>
    public class HiddenGemsRepository : IHiddenGemsRepository
    {
        private readonly IDataRepository _db;

        /// <summary>
        /// Initializes a new instance of HiddenGemsRepository using the default connection.
        /// </summary>
        public HiddenGemsRepository(IDataRepositoryFactory factory)
        {
            _db = factory.Create("DefaultConnection");
        }

        /// <inheritdoc/>
        public async Task<HiddenGemResponse> GetHiddenGemsAsync(
            string countryCode, int year, int minCountries, int page, int pageSize)
        {
            var offset = (page - 1) * pageSize;

            var rows = await _db.GetDataAsync("sp_GetHiddenGems", new Dictionary<string, object?>
            {
                { "@CountryCode", countryCode },
                { "@Year", year },
                { "@MinCountries", minCountries },
                { "@Offset", offset },
                { "@PageSize", pageSize }
            });

            return new HiddenGemResponse
            {
                Items = rows.Select(MapRow).ToList(),
                Page = page,
                PageSize = pageSize
            };
        }

        private static HiddenGem MapRow(IDictionary<string, object?> row)
        {
            return new HiddenGem
            {
                SongName = AsString(row, "song_name"),
                AlbumName = AsString(row, "album_name"),
                ArtistName = AsString(row, "artist_name"),
                Genre = AsString(row, "genre"),
                PreviewUrl = AsString(row, "preview_url"),
                TrendScore = AsDecimal(row, "trend_score"),
                CountriesChartingCount = AsInt(row, "countries_charting_count")
            };
        }

        private static string? AsString(IDictionary<string, object?> row, string key)
            => row.TryGetValue(key, out var v) ? v?.ToString() : null;

        private static int AsInt(IDictionary<string, object?> row, string key)
            => row.TryGetValue(key, out var v) && v != null ? Convert.ToInt32(v) : 0;

        private static decimal AsDecimal(IDictionary<string, object?> row, string key)
            => row.TryGetValue(key, out var v) && v != null ? Convert.ToDecimal(v) : 0m;
    }
}
