namespace Capstone.API.Models.Country
{
    /// <summary>
    /// Stores a lightweight favorite artist sample for a country-year view.
    /// </summary>
    public class FavoriteArtistSample
    {
        public string Artist { get; set; } = string.Empty;
        public string SongTitle { get; set; } = string.Empty;
        public string? ArtistImageUrl { get; set; }
    }
}
