namespace Capstone.API.Infrastructure.Repositories
{
    internal static class RowValueReader
    {
        public static string? AsStringAny(IDictionary<string, object?> row, params string[] keys)
        {
            foreach (var key in keys)
            {
                if (row.TryGetValue(key, out var value) && value != null)
                {
                    return value.ToString();
                }
            }

            return null;
        }

        public static int AsIntAny(IDictionary<string, object?> row, params string[] keys)
        {
            foreach (var key in keys)
            {
                if (row.TryGetValue(key, out var value) && value != null)
                {
                    return Convert.ToInt32(value);
                }
            }

            return 0;
        }

        public static double AsDoubleAny(IDictionary<string, object?> row, params string[] keys)
        {
            foreach (var key in keys)
            {
                if (row.TryGetValue(key, out var value) && value != null)
                {
                    return Convert.ToDouble(value);
                }
            }

            return 0d;
        }

        public static decimal AsDecimalAny(IDictionary<string, object?> row, params string[] keys)
        {
            foreach (var key in keys)
            {
                if (row.TryGetValue(key, out var value) && value != null)
                {
                    return Convert.ToDecimal(value);
                }
            }

            return 0m;
        }
    }
}
