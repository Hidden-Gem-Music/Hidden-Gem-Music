using System.Text.Json;

namespace Capstone.API.Infrastructure.Interfaces
{
    /// <summary>
    /// Reads and writes locally warmed endpoint payloads used for presentation demos.
    /// </summary>
    public interface IPresentationDataCacheService
    {
        Task<JsonElement?> GetAsync(string key, CancellationToken cancellationToken = default);
        Task SaveAsync(string key, object payload, CancellationToken cancellationToken = default);
    }
}
