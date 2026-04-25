namespace Capstone.API.Models.Shared
{
    /// <summary>
    /// Represents a song that charts in both countries on a comparison page,
    /// with each country's chart rank shown side by side.
    /// </summary>
    public class SharedSong
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

        /// <summary>
        /// Gets or sets the chart rank of this song in Country A.
        /// </summary>
        public int RankInCountryA { get; set; }

        /// <summary>
        /// Gets or sets the chart rank of this song in Country B.
        /// </summary>
        public int RankInCountryB { get; set; }
    }
}
