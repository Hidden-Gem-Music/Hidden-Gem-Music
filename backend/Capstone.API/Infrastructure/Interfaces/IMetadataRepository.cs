namespace Capstone.API.Infrastructure.Interfaces
{
    /// <summary>
    /// Defines data access for shared metadata endpoints.
    /// </summary>
    public interface IMetadataRepository
    {
        /// <summary>
        /// Returns the list of available chart years present in the dataset.
        /// Calls sp_GetAvailableYears.
        /// </summary>
        Task<IEnumerable<int>> GetAvailableYearsAsync(CancellationToken cancellationToken = default);
    }
}
