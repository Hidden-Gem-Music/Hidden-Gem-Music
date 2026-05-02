namespace Capstone.API.Models.HiddenGems
{
    /// <summary>
    /// Represents a paginated response for the Hidden Gems endpoint.
    /// Wraps the current page of hidden gem results along with pagination metadata.
    /// </summary>
    public class HiddenGemResponse
    {
        /// <summary>
        /// Gets or sets the list of hidden gems for the current page.
        /// </summary>
        public List<HiddenGem> Items { get; set; } = new();

        /// <summary>
        /// Gets or sets the current page number (1-based).
        /// </summary>
        public int Page { get; set; }

        /// <summary>
        /// Gets or sets the maximum number of items returned per page.
        /// </summary>
        public int PageSize { get; set; }

        /// <summary>
        /// Gets or sets the total number of matching rows across all pages.
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// Gets or sets whether another page exists after this one.
        /// </summary>
        public bool HasMore { get; set; }
    }
}
