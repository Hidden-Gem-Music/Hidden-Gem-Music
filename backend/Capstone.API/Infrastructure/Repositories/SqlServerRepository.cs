using Microsoft.Data.SqlClient;
using System.Data;
using Capstone.API.Infrastructure.Interfaces;

namespace Capstone.API.Infrastructure.Interfaces.Repositories
{
    /// <summary>
    /// SQL Server implementation of the data repository for executing stored procedures.
    /// </summary>
    public class SqlServerRepository : IDataRepository
{
    private readonly string _connectionString = string.Empty;

    /// <summary>
    /// Initializes a new instance of the SqlServerRepository.
    /// </summary>
    /// <param name="connectionString">The SQL Server connection string.</param>
    public SqlServerRepository(string connectionString)
    {
        _connectionString = connectionString ?? string.Empty;
    }

    /// <summary>
    /// Executes a stored procedure without parameters and returns the result set.
    /// </summary>
    /// <param name="storedProc">The name of the stored procedure to execute.</param>
    /// <returns>A collection of rows returned by the stored procedure.</returns>
    public async Task<IEnumerable<IDictionary<string, object?>>> GetDataAsync(string storedProc)
    {
        var results = new List<IDictionary<string, object?>>();

        using (var connection = new SqlConnection(_connectionString))
        {
            using (var command = new SqlCommand(storedProc, connection))
            {
                command.CommandType = CommandType.StoredProcedure;

                await connection.OpenAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        var newRow = new Dictionary<string, object?>();
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            newRow[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                        }
                        results.Add(newRow);
                    }
                }
            }
        }

        return results;
    }

    /// <summary>
    /// Executes a stored procedure with parameters and returns the result set.
    /// </summary>
    /// <param name="storedProc">The name of the stored procedure to execute.</param>
    /// <param name="parameters">A dictionary of parameter names and values to pass to the stored procedure.</param>
    /// <returns>A collection of rows returned by the stored procedure.</returns>
    public async Task<IEnumerable<IDictionary<string, object?>>> GetDataAsync(string storedProc, IDictionary<string, object?>? parameters)
    {
        var results = new List<IDictionary<string, object?>>();

        using (var connection = new SqlConnection(_connectionString))
        {
            using (var command = new SqlCommand(storedProc, connection))
            {
                command.CommandType = CommandType.StoredProcedure;

                if (parameters != null)
                {
                    foreach (var kvp in parameters)
                    {
                        // Ensure parameter name starts with @
                        var paramName = kvp.Key.StartsWith("@") ? kvp.Key : "@" + kvp.Key;
                        command.Parameters.AddWithValue(paramName, kvp.Value ?? DBNull.Value);
                    }
                }

                await connection.OpenAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        var row = new Dictionary<string, object?>();
                        for (int i = 0; i < reader.FieldCount; i++)
                        {
                            var name = reader.GetName(i);
                            var value = await reader.IsDBNullAsync(i) ? null : reader.GetValue(i);
                            row[name] = value;
                        }

                        results.Add(row);
                    }
                }
            }
        }

        return results;
    }

    /// <summary>
    /// Executes a stored procedure with parameters and returns multiple result sets.
    /// </summary>
    /// <param name="storedProc">The name of the stored procedure to execute.</param>
    /// <param name="parameters">A dictionary of parameter names and values to pass to the stored procedure.</param>
    /// <returns>A list of result sets, where each result set is a collection of rows.</returns>
    public async Task<List<List<IDictionary<string, object?>>>> GetDataSetsAsync(string storedProc, IDictionary<string, object?>? parameters)
    {
        var dataSets = new List<List<IDictionary<string, object?>>>();

        using (var connection = new SqlConnection(_connectionString))
        {
            using (var command = new SqlCommand(storedProc, connection))
            {
                command.CommandType = CommandType.StoredProcedure;

                if (parameters != null)
                {
                    foreach (var kvp in parameters)
                    {
                        var paramName = kvp.Key.StartsWith("@") ? kvp.Key : "@" + kvp.Key;
                        command.Parameters.AddWithValue(paramName, kvp.Value ?? DBNull.Value);
                    }
                }

                await connection.OpenAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    do
                    {
                        var results = new List<IDictionary<string, object?>>();
                        while (await reader.ReadAsync())
                        {
                            var row = new Dictionary<string, object?>();
                            for (int i = 0; i < reader.FieldCount; i++)
                            {
                                var name = reader.GetName(i);
                                var value = await reader.IsDBNullAsync(i) ? null : reader.GetValue(i);
                                row[name] = value;
                            }
                            results.Add(row);
                        }
                        dataSets.Add(results);
                    }
                    while (await reader.NextResultAsync());
                }
            }
        }

        return dataSets;
    }
}
}