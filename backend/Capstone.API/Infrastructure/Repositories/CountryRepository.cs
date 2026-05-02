using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.Country;
using Capstone.API.Models.Shared;

namespace Capstone.API.Infrastructure.Repositories
{
    /// <summary>
    /// Retrieves country profile and hidden gems preview data.
    /// Uses GetDataSetsAsync for sp_GetCountryProfile because it returns multiple result sets:
    /// result set 0 = summary stats, set 1 = top shared songs, set 2 = top unique songs.
    /// </summary>
    public class CountryRepository : ICountryRepository
    {
        private readonly IDataRepository _db;

        /// <summary>
        /// Initializes a new instance of CountryRepository using the default connection.
        /// </summary>
        public CountryRepository(IDataRepositoryFactory factory)
        {
            _db = factory.Create("DefaultConnection");
        }

        /// <inheritdoc/>
        public async Task<CountryProfile?> GetCountryProfileAsync(string countryCode, int year)
        {
            var sets = await _db.GetDataSetsAsync("sp_GetCountryProfile", new Dictionary<string, object?>
            {
                { "@CountryCode", countryCode },
                { "@Year", year }
            });

            if (sets.Count == 0 || sets[0].Count == 0)
                return null;

            var stats = sets[0][0];

            var profile = new CountryProfile
            {
                CountryCode = RowValueReader.AsStringAny(stats, "country_code", "iso_code"),
                CountryName = RowValueReader.AsStringAny(stats, "country_name", "full_name"),
                Year = RowValueReader.AsIntAny(stats, "chart_year", "year"),
                TotalCharted = RowValueReader.AsIntAny(stats, "total_charted"),
                SharedCount = RowValueReader.AsIntAny(stats, "shared_count"),
                UniqueCount = RowValueReader.AsIntAny(stats, "unique_count"),
                OverlapPct = RowValueReader.AsDecimalAny(stats, "overlap_pct")
            };

            if (sets.Count > 1)
                profile.TopSharedSongs = sets[1].Select(MapSong).ToList();

            if (sets.Count > 2)
                profile.TopUniqueSongs = sets[2].Select(MapSong).ToList();

            return profile;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<CountryHiddenGemPreviewItem>> GetHiddenGemsPreviewAsync(string countryCode, int year, int limit)
        {
            var rows = await _db.GetDataAsync("sp_GetCountryHiddenGemsPreview", new Dictionary<string, object?>
            {
                { "@CountryCode", countryCode },
                { "@Year", year },
                { "@Limit", limit }
            });

            return rows.Select(MapHiddenGem);
        }

        /// <inheritdoc/>
        public async Task<CountrySongsPage> GetCountrySongsPageAsync(string countryCode, int year, string listType, int page, int pageSize)
        {
            var safePage = Math.Max(page, 1);
            var safePageSize = Math.Clamp(pageSize, 1, 100);
            var offset = (safePage - 1) * safePageSize;

            var rows = (await _db.GetDataAsync("sp_GetCountrySongsPaged", new Dictionary<string, object?>
            {
                { "@CountryCode", countryCode },
                { "@Year", year },
                { "@ListType", listType },
                { "@Offset", offset },
                { "@PageSize", safePageSize }
            })).ToList();

            var totalCount = rows.Count > 0 ? RowValueReader.AsIntAny(rows[0], "total_count", "TotalCount") : 0;
            var items = rows.Select(MapSong).ToList();
            var loadedItemCount = offset + items.Count;

            return new CountrySongsPage
            {
                Items = items,
                Page = safePage,
                PageSize = safePageSize,
                TotalCount = totalCount,
                HasMore = loadedItemCount < totalCount
            };
        }

        private static Song MapSong(IDictionary<string, object?> row)
        {
            return new Song
            {
                SongName = RowValueReader.AsStringAny(row, "song_name", "song_title", "title"),
                ArtistName = RowValueReader.AsStringAny(row, "artist_name"),
                AlbumName = RowValueReader.AsStringAny(row, "album_name")
            };
        }

        private static CountryHiddenGemPreviewItem MapHiddenGem(IDictionary<string, object?> row)
        {
            return new CountryHiddenGemPreviewItem
            {
                SongName = RowValueReader.AsStringAny(row, "song_name", "song_title", "title"),
                AlbumName = RowValueReader.AsStringAny(row, "album_name"),
                ArtistName = RowValueReader.AsStringAny(row, "artist_name"),
                TrendScore = RowValueReader.AsDecimalAny(row, "trend_score"),
                CountriesChartingCount = RowValueReader.AsIntAny(row, "countries_charting_count", "countries_charting")
            };
        }
    }
}
