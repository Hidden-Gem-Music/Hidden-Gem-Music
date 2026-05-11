namespace Capstone.API.Models.Country
{
    /// <summary>
    /// Represents one hidden-gem teaser item for the country page preview strip.
    /// Returned by sp_GetCountryHiddenGemsPreview.
    /// </summary>
    public class CountryHiddenGemPreviewItem
    {
        public string? SongName { get; set; }
        public string? AlbumName { get; set; }
        public string? ArtistName { get; set; }
        public decimal TrendScore { get; set; }
        public int CountriesChartingCount { get; set; }
        public long? DeezerTrackId { get; set; }
        public long? DeezerAlbumId { get; set; }
        public long? DeezerArtistId { get; set; }
        public string? ArtistImageUrl { get; set; }
        public string? AlbumArtUrl { get; set; }
        public List<string> Genres { get; set; } = new();
        public string? PreviewUrl { get; set; }
        public DateTimeOffset? PreviewExpiresAtUtc { get; set; }
        public bool? ExplicitLyrics { get; set; }
        public bool? ExplicitContentCover { get; set; }
        public bool? AlbumExplicitLyrics { get; set; }
        public string? ReleaseDate { get; set; }
        public string? RecordType { get; set; }
        public List<string> Contributors { get; set; } = new();
        public int? ArtistAlbumCount { get; set; }
    }
}
