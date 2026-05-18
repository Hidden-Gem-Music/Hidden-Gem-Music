using Capstone.API.Models.Country;

namespace Capstone.API.Infrastructure.Interfaces
{
    /// <summary>
    /// Reads and writes file-backed Discovery genre/language samples.
    /// </summary>
    public interface IDiscoverySampleCacheService
    {
        Task<IReadOnlyList<string>> GetGenresAsync(string countryCode, int year, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<string>> GetLanguagesAsync(string countryCode, int year, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<FavoriteArtistSample>> GetFavoriteArtistsAsync(string countryCode, int year, CancellationToken cancellationToken = default);
        Task SaveGenresAsync(string countryCode, int year, IReadOnlyList<string> genres, CancellationToken cancellationToken = default);
        Task SaveLanguagesAsync(string countryCode, int year, IReadOnlyList<string> languages, CancellationToken cancellationToken = default);
        Task SaveFavoriteArtistsAsync(string countryCode, int year, IReadOnlyList<FavoriteArtistSample> favoriteArtists, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<DiscoverySampleCacheEntry>> GetAllAsync(CancellationToken cancellationToken = default);
    }
}
