using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.Country;
using Capstone.API.Models.HiddenGems;
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
                CountryCode = AsString(stats, "country_code"),
                CountryName = AsString(stats, "country_name"),
                Year = AsInt(stats, "chart_year"),
                TotalCharted = AsInt(stats, "total_charted"),
                SharedCount = AsInt(stats, "shared_count"),
                UniqueCount = AsInt(stats, "unique_count"),
                OverlapPct = AsDecimal(stats, "overlap_pct")
            };

            if (sets.Count > 1)
                profile.TopSharedSongs = sets[1].Select(MapSong).ToList();

            if (sets.Count > 2)
                profile.TopUniqueSongs = sets[2].Select(MapSong).ToList();

            return profile;
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<HiddenGem>> GetHiddenGemsPreviewAsync(string countryCode, int year)
        {
            var rows = await _db.GetDataAsync("sp_GetCountryHiddenGemsPreview", new Dictionary<string, object?>
            {
                { "@CountryCode", countryCode },
                { "@Year", year }
            });

            return rows.Select(MapHiddenGem);
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

        private static HiddenGem MapHiddenGem(IDictionary<string, object?> row)
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
