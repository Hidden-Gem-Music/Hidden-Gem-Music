using System;
using Microsoft.Extensions.Configuration;
using Capstone.API.Infrastructure.Interfaces;


namespace Capstone.API.Infrastructure.Interfaces.Repositories
{
    /// <summary>
    /// Factory class that creates data repository instances based on configuration settings.
    /// </summary>
    public class DataRepositoryFactory : IDataRepositoryFactory
    {
        private readonly IConfiguration _configuration;

        /// <summary>
        /// Initializes a new instance of the DataRepositoryFactory.
        /// </summary>
        /// <param name="configuration">The application configuration.</param>
        public DataRepositoryFactory(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        /// Creates a data repository for the specified database.
        /// </summary>
        /// <param name="databaseName">The name of the database connection string in configuration.</param>
        /// <returns>An IDataRepository instance for the specified database.</returns>
        /// <exception cref="ArgumentException">Thrown when the connection string is null or empty.</exception>
        /// <exception cref="NotSupportedException">Thrown when the database provider is not supported.</exception>
        public IDataRepository Create(string databaseName)
        {
            var connectionString = _configuration.GetConnectionString(databaseName);
            if (string.IsNullOrEmpty(connectionString))
                throw new ArgumentException($"Connection string '{databaseName}' is null or empty.");

            var dbProvider = _configuration["DbProvider"] ?? "SqlServer"; // Default to SqlServer if not specified

            switch (dbProvider.Trim().ToLower())
            {
                case "mysql":
                    return new MySqlRepository(connectionString);
                case "sqlserver":
                    return new SqlServerRepository(connectionString);
                default:
                    throw new NotSupportedException($"Database provider '{dbProvider}' is not supported.");
            }
        }
    }
}