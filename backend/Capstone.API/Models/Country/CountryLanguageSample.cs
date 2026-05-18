namespace Capstone.API.Models.Country
{
    /// <summary>
    /// Represents a small file-backed language sample for one country and year.
    /// </summary>
    public class CountryLanguageSample
    {
        public string CountryCode { get; set; } = "";
        public List<string> Languages { get; set; } = [];
    }
}
