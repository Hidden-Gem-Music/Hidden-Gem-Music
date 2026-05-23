namespace Capstone.API.Controllers
{
    internal static class BackgroundTaskLogger
    {
        public static void LogFailure(Task task, ILogger logger, string operation)
        {
            _ = LogFailureAsync(task, logger, operation);
        }

        private static async Task LogFailureAsync(Task task, ILogger logger, string operation)
        {
            try
            {
                await task;
            }
            catch (OperationCanceledException)
            {
                // Cache writes are best-effort background work; canceled writes should not fail the API response.
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Background cache write failed for {Operation}", operation);
            }
        }
    }
}
