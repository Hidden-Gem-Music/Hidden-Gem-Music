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
    }
}
