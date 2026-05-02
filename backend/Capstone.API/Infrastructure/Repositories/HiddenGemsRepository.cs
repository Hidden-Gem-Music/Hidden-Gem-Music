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

            var rows = (await _db.GetDataAsync("sp_GetHiddenGems", new Dictionary<string, object?>
            {
                { "@CountryCode", countryCode },
                { "@Year", year },
                { "@MinCountries", minCountries },
                { "@Offset", offset },
                { "@PageSize", pageSize }
            })).ToList();

            var totalCount = rows.Count > 0 ? RowValueReader.AsIntAny(rows[0], "total_count", "TotalCount") : 0;
            var loadedItemCount = offset + rows.Count;

            return new HiddenGemResponse
            {
                Items = rows.Select(MapRow).ToList(),
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                HasMore = loadedItemCount < totalCount
            };
        }

        private static HiddenGem MapRow(IDictionary<string, object?> row)
        {
            return new HiddenGem
            {
                // Keep current preferred keys first, but accept star-schema aliases when present.
                SongName = RowValueReader.AsStringAny(row, "song_name", "song_title", "title"),
                AlbumName = RowValueReader.AsStringAny(row, "album_name"),
                ArtistName = RowValueReader.AsStringAny(row, "artist_name"),
                Genre = RowValueReader.AsStringAny(row, "genre"),
                PreviewUrl = RowValueReader.AsStringAny(row, "preview_url", "spotify_id"),
                TrendScore = RowValueReader.AsDecimalAny(row, "trend_score"),
                CountriesChartingCount = RowValueReader.AsIntAny(row, "countries_charting_count", "countries_charting", "country_count")
            };
        }
    }
}
