namespace Capstone.API.Models.Globe
{
    /// <summary>
    /// Represents a country's summary data for globe dot rendering and hover cards.
    /// Returned by sp_GetGlobeSummary.
    /// </summary>
    public class CountryGlobeSummary
    {
        /// <summary>
        /// Gets or sets the 2-letter ISO country code used by Mapbox for rendering.
        /// </summary>
        public string? CountryCode { get; set; }

        /// <summary>
        /// Gets or sets the full display name of the country.
        /// </summary>
        public string? CountryName { get; set; }

        /// <summary>
        /// Gets or sets the latitude for Mapbox dot placement.
        /// </summary>
        public double Lat { get; set; }

        /// <summary>
        /// Gets or sets the longitude for Mapbox dot placement.
        /// </summary>
        public double Long { get; set; }

        /// <summary>
        /// Gets or sets the number of hidden gems for this country, shown on the hover card.
        /// </summary>
        public int HiddenGemCount { get; set; }

        /// <summary>
        /// Gets or sets the name of the top album for this country, shown on the hover card.
        /// Nullable — may not be available for all countries.
        /// </summary>
        public string? TopAlbumName { get; set; }
    }
}
