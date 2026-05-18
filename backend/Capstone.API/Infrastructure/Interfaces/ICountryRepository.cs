using Capstone.API.Models.Country;

namespace Capstone.API.Infrastructure.Interfaces
{
    /// <summary>
    /// Defines data access for the Country Profile screen.
    /// </summary>
    public interface ICountryRepository
    {
        /// <summary>
        /// Returns full chart statistics and top song lists for a single country and year.
        /// Calls sp_GetCountryProfile.
        /// </summary>
        /// <param name="countryCode">2-letter ISO country code.</param>
        /// <param name="year">The chart year to filter by.</param>
        Task<CountryProfile?> GetCountryProfileAsync(string countryCode, int year, CancellationToken cancellationToken = default);

        /// <summary>
        /// Returns hidden gems for the teaser widget on the country page.
        /// Calls sp_GetCountryHiddenGemsPreview.
        /// </summary>
        /// <param name="countryCode">2-letter ISO country code.</param>
        /// <param name="year">The chart year to filter by.</param>
        /// <param name="limit">Maximum number of rows to return.</param>
        Task<IEnumerable<CountryHiddenGemPreviewItem>> GetHiddenGemsPreviewAsync(string countryCode, int year, int limit, CancellationToken cancellationToken = default);

        /// <summary>
        /// Returns a paginated list of shared or unique songs for a country-year view.
        /// Calls sp_GetCountrySongsPaged.
        /// </summary>
        /// <param name="countryCode">2-letter ISO country code.</param>
        /// <param name="year">The chart year to filter by.</param>
        /// <param name="listType">Either "shared" or "unique".</param>
        /// <param name="page">1-based page number.</param>
        /// <param name="pageSize">Results per page.</param>
        Task<CountrySongsPage> GetCountrySongsPageAsync(string countryCode, int year, string listType, int page, int pageSize, CancellationToken cancellationToken = default);

        /// <summary>
        /// Returns a small set of sampled distinct genres for a country-year view.
        /// </summary>
        Task<IReadOnlyList<string>> GetCountryGenreSampleAsync(string countryCode, int year, CancellationToken cancellationToken = default);

        /// <summary>
        /// Returns a small set of sampled distinct lyric languages for a country-year view.
        /// </summary>
        Task<IReadOnlyList<string>> GetCountryLanguageSampleAsync(string countryCode, int year, CancellationToken cancellationToken = default);
    }
}
