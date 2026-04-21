namespace Capstone.API.Models.HiddenGems
{
    /// <summary>
    /// Represents a single hidden gem — a song that is trending in multiple other countries
    /// but has not yet charted in the selected country.
    /// Returned by sp_GetHiddenGems and sp_GetCountryHiddenGemsPreview.
    /// </summary>
    public class HiddenGem
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
        /// Gets or sets the genre of the song.
        /// Nullable — genre is not natively present in either dataset.
        /// </summary>
        public string? Genre { get; set; }

        /// <summary>
        /// Gets or sets the URL for a 30-second preview audio clip.
        /// Nullable — not available for all songs.
        /// </summary>
        public string? PreviewUrl { get; set; }

        /// <summary>
        /// Gets or sets the BDA-defined trend score for this hidden gem.
        /// Higher scores indicate stronger trending momentum across other countries.
        /// </summary>
        public decimal TrendScore { get; set; }

        /// <summary>
        /// Gets or sets the number of countries this song is currently charting in.
        /// </summary>
        public int CountriesChartingCount { get; set; }
    }
}
