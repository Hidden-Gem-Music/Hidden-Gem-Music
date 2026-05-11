using Capstone.API.Models.Shared;
using Capstone.API.Models.HiddenGems;

namespace Capstone.API.Infrastructure.Interfaces
{
    /// <summary>
    /// Enriches song rows from Deezer at request time and caches stable song metadata locally.
    /// </summary>
    public interface IDeezerSongEnrichmentService
    {
        /// <summary>
        /// Resolves reusable Deezer song metadata by song title and artist name.
        /// Returns null when the song cannot be resolved to usable Deezer data.
        /// </summary>
        Task<DeezerSongMetadata?> ResolveSongMetadataAsync(
            string songName,
            string artistName,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Returns a displayable hidden-gem row enriched from Deezer, or null when the song
        /// cannot be resolved to usable Deezer data.
        /// </summary>
        Task<HiddenGem?> EnrichHiddenGemAsync(HiddenGem item, CancellationToken cancellationToken = default);
    }
}
