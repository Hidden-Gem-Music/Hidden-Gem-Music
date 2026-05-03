using Capstone.API.Models.Shared;

namespace Capstone.API.Models.Country
{
    /// <summary>
    /// Represents a paginated songs response for country shared/unique song lists.
    /// </summary>
    public class CountrySongsPage
    {
        /// <summary>
        /// Gets or sets the returned page items.
        /// </summary>
        public List<Song> Items { get; set; } = new();

        /// <summary>
        /// Gets or sets the current 1-based page number.
        /// </summary>
        public int Page { get; set; }

        /// <summary>
        /// Gets or sets the page size used for this response.
        /// </summary>
        public int PageSize { get; set; }

        /// <summary>
        /// Gets or sets total items available for this list type.
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// Gets whether there are additional pages available.
        /// </summary>
        public bool HasMore { get; set; }
    }
}
