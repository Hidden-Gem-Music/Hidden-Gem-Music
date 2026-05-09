namespace Capstone.API.Models.Country
{
    /// <summary>
    /// Represents a small live-resolved genre sample for one country and year.
    /// </summary>
    public class CountryGenreSample
    {
        public string CountryCode { get; set; } = string.Empty;
        public List<string> Genres { get; set; } = new();
    }
}
