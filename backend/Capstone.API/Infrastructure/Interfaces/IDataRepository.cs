namespace Capstone.API.Infrastructure.Interfaces
{
    /// <summary>
    /// Defines the contract for data repository operations that interact with stored procedures.
    /// </summary>
    public interface IDataRepository
    {
        /// <summary>
        /// Executes a stored procedure without parameters and returns the results.
        /// </summary>
        /// <param name="storedProc">The name of the stored procedure to execute.</param>
        /// <returns>A collection of rows where each row is represented as a dictionary of column names to values.</returns>
        Task<IEnumerable<IDictionary<string, object?>>> GetDataAsync(string storedProc);

        /// <summary>
        /// Executes a stored procedure with parameters and returns the results.
        /// </summary>
        /// <param name="storedProc">The name of the stored procedure to execute.</param>
        /// <param name="parameters">A dictionary of parameter names and values to pass to the stored procedure.</param>
        /// <returns>A collection of rows where each row is represented as a dictionary of column names to values.</returns>
        Task<IEnumerable<IDictionary<string, object?>>> GetDataAsync(string storedProc, IDictionary<string, object?> parameters);

        /// <summary>
        /// Executes a stored procedure with parameters and returns multiple result sets.
        /// </summary>
        /// <param name="storedProc">The name of the stored procedure to execute.</param>
        /// <param name="parameters">A dictionary of parameter names and values to pass to the stored procedure.</param>
        /// <returns>A list of result sets, where each result set is a collection of rows.</returns>
        Task<List<List<IDictionary<string, object?>>>> GetDataSetsAsync(string storedProc, IDictionary<string, object?> parameters);
    }
}