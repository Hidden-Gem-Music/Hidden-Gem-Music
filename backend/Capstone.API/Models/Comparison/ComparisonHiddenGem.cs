namespace Capstone.API.Models.Comparison
{
    /// <summary>
    /// Represents a song trending in surrounding regions that is absent from both compared countries.
    /// Returned by sp_GetComparisonHiddenGems.
    /// </summary>
    public class ComparisonHiddenGem
    {
        /// <summary>
        /// Gets or sets the title of the song.
        /// </summary>
        public string? SongName { get; set; }

        /// <summary>
        /// Gets or sets the name of the album the song belongs to.
        /// Nullable — no album data exists in Dataset 1.
        /// </summary>
        public string? AlbumName { get; set; }

        /// <summary>
        /// Gets or sets the name of the primary artist.
        /// </summary>
        public string? ArtistName { get; set; }

        /// <summary>
        /// Gets or sets the BDA-defined trend score indicating how strongly this song
        /// is trending in other regions.
        /// </summary>
        public decimal TrendScore { get; set; }

        /// <summary>
        /// Gets or sets the number of countries this song is currently charting in.
        /// </summary>
        public int CountriesChartingCount { get; set; }
    }
}
