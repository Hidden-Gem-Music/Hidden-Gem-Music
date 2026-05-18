namespace Capstone.API.Models.Country
{
    /// <summary>
    /// Stores resolved Discovery genre/language samples for a country and year.
    /// </summary>
    public class DiscoverySampleCacheEntry
    {
        public string CountryCode { get; set; } = string.Empty;
        public int Year { get; set; }
        public List<string> Genres { get; set; } = new();
        public List<string> Languages { get; set; } = new();
        public List<FavoriteArtistSample> FavoriteArtists { get; set; } = new();
        public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}
