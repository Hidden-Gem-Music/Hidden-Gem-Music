using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.Comparison;
using Capstone.API.Models.Shared;

namespace Capstone.API.Infrastructure.Repositories
{
    /// <summary>
    /// Retrieves country comparison data by calling sp_GetCountryComparison and sp_GetComparisonHiddenGems.
    /// sp_GetCountryComparison returns 5 result sets in order:
    /// 0 = CountryA stats, 1 = CountryB stats, 2 = shared songs, 3 = unique to A, 4 = unique to B.
    /// </summary>
    public class ComparisonRepository : IComparisonRepository
    {
        private readonly IDataRepository _db;

        /// <summary>
        /// Initializes a new instance of ComparisonRepository using the default connection.
        /// </summary>
        public ComparisonRepository(IDataRepositoryFactory factory)
        {
            _db = factory.Create("DefaultConnection");
        }

        /// <inheritdoc/>
        public async Task<ComparisonResult?> GetCountryComparisonAsync(
            string countryCodeA, string countryCodeB, int year)
        {
            var sets = await _db.GetDataSetsAsync("sp_GetCountryComparison", new Dictionary<string, object?>
            {
                { "@CountryCodeA", countryCodeA },
                { "@CountryCodeB", countryCodeB },
                { "@Year", year }
            });

            if (sets.Count < 2 || sets[0].Count == 0 || sets[1].Count == 0)
                return null;

            var result = new ComparisonResult
            {
                CountryA = MapSide(sets[0][0]),
                CountryB = MapSide(sets[1][0])
            };

            if (sets.Count > 2)
                result.SharedSongs = sets[2].Select(MapSharedSong).ToList();

            if (sets.Count > 3)
                result.UniqueToA = sets[3].Select(MapSong).ToList();

            if (sets.Count > 4)
                result.UniqueToB = sets[4].Select(MapSong).ToList();

            return result;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<ComparisonHiddenGem>> GetComparisonHiddenGemsAsync(
            string countryCodeA, string countryCodeB, int year)
        {
            var rows = await _db.GetDataAsync("sp_GetComparisonHiddenGems", new Dictionary<string, object?>
            {
                { "@CountryCodeA", countryCodeA },
                { "@CountryCodeB", countryCodeB },
                { "@Year", year }
            });

            return rows.Select(MapComparisonHiddenGem);
        }

        private static CountryComparisonSide MapSide(IDictionary<string, object?> row)
        {
            return new CountryComparisonSide
            {
                CountryCode = AsString(row, "country_code"),
                CountryName = AsString(row, "country_name"),
                TotalCharted = AsInt(row, "total_charted"),
                SharedCount = AsInt(row, "shared_count"),
                UniqueCount = AsInt(row, "unique_count"),
                OverlapPct = AsDecimal(row, "overlap_pct")
            };
        }

        private static SharedSong MapSharedSong(IDictionary<string, object?> row)
        {
            return new SharedSong
            {
                SongName = AsString(row, "song_name"),
                ArtistName = AsString(row, "artist_name"),
                AlbumName = AsString(row, "album_name"),
                RankInCountryA = AsInt(row, "rank_in_country_a"),
                RankInCountryB = AsInt(row, "rank_in_country_b")
            };
        }

        private static Song MapSong(IDictionary<string, object?> row)
        {
            return new Song
            {
                SongName = AsString(row, "song_name"),
                ArtistName = AsString(row, "artist_name"),
                AlbumName = AsString(row, "album_name")
            };
        }

        private static ComparisonHiddenGem MapComparisonHiddenGem(IDictionary<string, object?> row)
        {
            return new ComparisonHiddenGem
            {
                SongName = AsString(row, "song_name"),
                AlbumName = AsString(row, "album_name"),
                ArtistName = AsString(row, "artist_name"),
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
