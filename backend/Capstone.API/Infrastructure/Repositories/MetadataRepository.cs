using Capstone.API.Infrastructure.Interfaces;

namespace Capstone.API.Infrastructure.Repositories
{
    /// <summary>
    /// Retrieves shared metadata used by multiple frontend controls.
    /// </summary>
    public class MetadataRepository : IMetadataRepository
    {
        private readonly IDataRepository _db;

        /// <summary>
        /// Initializes a new instance of MetadataRepository using the default connection.
        /// </summary>
        public MetadataRepository(IDataRepositoryFactory factory)
        {
            _db = factory.Create("DefaultConnection");
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<int>> GetAvailableYearsAsync(CancellationToken cancellationToken = default)
        {
            var rows = await _db.GetDataAsync("sp_GetAvailableYears", cancellationToken);

            return rows
                .Select((row) => RowValueReader.AsIntAny(row, "chart_year"))
                .Where((year) => year > 0)
                .Distinct()
                .OrderBy((year) => year)
                .ToList();
        }
    }
}
