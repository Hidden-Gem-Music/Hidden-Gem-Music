namespace Capstone.API.Models.Shared
{
    /// <summary>
    /// Represents a minimal song entry used in listings such as top shared songs
    /// and top unique songs on the country profile and comparison pages.
    /// </summary>
    public class Song
    {
        /// <summary>
        /// Gets or sets the title of the song.
        /// </summary>
        public string? SongName { get; set; }

        /// <summary>
        /// Gets or sets the name of the primary artist.
        /// </summary>
        public string? ArtistName { get; set; }

        /// <summary>
        /// Gets or sets the name of the album.
        /// Nullable — no album data exists in Dataset 1.
        /// </summary>
        public string? AlbumName { get; set; }

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
