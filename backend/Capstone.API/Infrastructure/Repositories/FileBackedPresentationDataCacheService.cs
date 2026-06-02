using System.Text.Json;
using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.Country;

namespace Capstone.API.Infrastructure.Repositories
{
    /// <summary>
    /// Persists warmed API responses so presentation demo pages can reuse them after restarts.
    /// </summary>
    public class FileBackedPresentationDataCacheService : IPresentationDataCacheService
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };

        private readonly string _cachePath;
        private readonly SemaphoreSlim _gate = new(1, 1);
        private Dictionary<string, PresentationDataCacheEntry>? _entriesByKey;

        public FileBackedPresentationDataCacheService(IWebHostEnvironment environment)
        {
            _cachePath = Path.Combine(environment.ContentRootPath, "Data", "presentation_data_cache.json");
        }

        public async Task<JsonElement?> GetAsync(string key, CancellationToken cancellationToken = default)
        {
            await _gate.WaitAsync(cancellationToken);
            try
            {
                await EnsureLoadedCoreAsync(cancellationToken);
                if (_entriesByKey!.TryGetValue(key, out var entry))
                {
                    if (HasExpiredPreview(entry.Payload, DateTimeOffset.UtcNow))
                    {
                        _entriesByKey.Remove(key);
                        await WriteCacheAsync(cancellationToken);
                        return null;
                    }

                    return entry.Payload.Clone();
                }

                return null;
            }
            finally
            {
                _gate.Release();
            }
        }

        public async Task SaveAsync(string key, object payload, CancellationToken cancellationToken = default)
        {
            await _gate.WaitAsync(cancellationToken);
            try
            {
                await EnsureLoadedCoreAsync(cancellationToken);
                _entriesByKey![key] = new PresentationDataCacheEntry
                {
                    Key = key,
                    Payload = JsonSerializer.SerializeToElement(payload, JsonOptions),
                    UpdatedAtUtc = DateTime.UtcNow
                };
                await WriteCacheAsync(cancellationToken);
            }
            finally
            {
                _gate.Release();
            }
        }

        private async Task EnsureLoadedAsync(CancellationToken cancellationToken)
        {
            if (_entriesByKey is not null)
            {
                return;
            }

            await _gate.WaitAsync(cancellationToken);
            try
            {
                await EnsureLoadedCoreAsync(cancellationToken);
            }
            finally
            {
                _gate.Release();
            }
        }

        private async Task EnsureLoadedCoreAsync(CancellationToken cancellationToken)
        {
            if (_entriesByKey is not null)
            {
                return;
            }

            if (!File.Exists(_cachePath))
            {
                _entriesByKey = new Dictionary<string, PresentationDataCacheEntry>(StringComparer.OrdinalIgnoreCase);
                return;
            }

            List<PresentationDataCacheEntry> entries;
            try
            {
                await using var stream = File.OpenRead(_cachePath);
                entries = await JsonSerializer.DeserializeAsync<List<PresentationDataCacheEntry>>(stream, JsonOptions, cancellationToken)
                    ?? new List<PresentationDataCacheEntry>();
            }
            catch (JsonException)
            {
                // File was truncated mid-write (e.g. server stopped between File.Create and flush).
                // Discard it and start fresh.
                entries = new List<PresentationDataCacheEntry>();
            }

            _entriesByKey = entries
                .Where(entry => !string.IsNullOrWhiteSpace(entry.Key))
                .GroupBy(entry => entry.Key, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    group => group.Key,
                    group => group.Last(),
                    StringComparer.OrdinalIgnoreCase);
        }

        private async Task WriteCacheAsync(CancellationToken cancellationToken)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(_cachePath)!);
            var entries = _entriesByKey!.Values
                .OrderBy(entry => entry.Key)
                .ToList();

            // Write to a temp file first so an interrupted write never corrupts the real cache.
            var tempPath = _cachePath + ".tmp";
            await using (var stream = File.Create(tempPath))
            {
                await JsonSerializer.SerializeAsync(stream, entries, JsonOptions, cancellationToken);
            }
            File.Move(tempPath, _cachePath, overwrite: true);
        }

        private static bool HasExpiredPreview(JsonElement element, DateTimeOffset now)
        {
            switch (element.ValueKind)
            {
                case JsonValueKind.Object:
                    if (element.TryGetProperty("previewExpiresAtUtc", out var expiresAtElement) &&
                        IsExpiredPreviewTimestamp(expiresAtElement, now))
                    {
                        return true;
                    }

                    if (element.TryGetProperty("previewUrl", out var previewUrlElement) &&
                        IsExpiredPreviewUrl(previewUrlElement, now))
                    {
                        return true;
                    }

                    foreach (var property in element.EnumerateObject())
                    {
                        if (HasExpiredPreview(property.Value, now))
                        {
                            return true;
                        }
                    }

                    return false;

                case JsonValueKind.Array:
                    foreach (var item in element.EnumerateArray())
                    {
                        if (HasExpiredPreview(item, now))
                        {
                            return true;
                        }
                    }

                    return false;

                default:
                    return false;
            }
        }

        private static bool IsExpiredPreviewTimestamp(JsonElement element, DateTimeOffset now)
        {
            return element.ValueKind == JsonValueKind.String &&
                   DateTimeOffset.TryParse(element.GetString(), out var expiresAtUtc) &&
                   expiresAtUtc <= now;
        }

        private static bool IsExpiredPreviewUrl(JsonElement element, DateTimeOffset now)
        {
            if (element.ValueKind != JsonValueKind.String ||
                !Uri.TryCreate(element.GetString(), UriKind.Absolute, out var uri))
            {
                return false;
            }

            var query = uri.Query.TrimStart('?');
            foreach (var queryPart in query.Split('&', StringSplitOptions.RemoveEmptyEntries))
            {
                var parts = queryPart.Split('=', 2);
                if (parts.Length != 2 || !parts[0].Equals("hdnea", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                var tokenParts = Uri.UnescapeDataString(parts[1]).Split('~', StringSplitOptions.RemoveEmptyEntries);
                foreach (var tokenPart in tokenParts)
                {
                    if (!tokenPart.StartsWith("exp=", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    var rawSeconds = tokenPart["exp=".Length..];
                    if (long.TryParse(rawSeconds, out var unixSeconds))
                    {
                        return DateTimeOffset.FromUnixTimeSeconds(unixSeconds) <= now;
                    }
                }
            }

            return false;
        }
    }
}
