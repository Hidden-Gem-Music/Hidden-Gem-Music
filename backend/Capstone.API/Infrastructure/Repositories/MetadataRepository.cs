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
        public async Task<IEnumerable<int>> GetAvailableYearsAsync()
        {
            var rows = await _db.GetDataAsync("sp_GetAvailableYears");

            return rows
                .Select((row) =>
                {
                    if (row.TryGetValue("chart_year", out var chartYear) && chartYear != null)
                        return Convert.ToInt32(chartYear);

                    if (row.TryGetValue("year", out var year) && year != null)
                        return Convert.ToInt32(year);

                    return 0;
                })
                .Where((year) => year > 0)
                .Distinct()
                .OrderBy((year) => year)
                .ToList();
        }
    }
}
