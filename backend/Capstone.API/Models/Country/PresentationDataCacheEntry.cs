using System.Text.Json;

namespace Capstone.API.Models.Country
{
    /// <summary>
    /// Stores a reusable local response payload for presentation data warming.
    /// </summary>
    public class PresentationDataCacheEntry
    {
        public string Key { get; set; } = string.Empty;
        public JsonElement Payload { get; set; }
        public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    }
}
