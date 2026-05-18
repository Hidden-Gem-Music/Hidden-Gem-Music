namespace Capstone.API.Models.Language
{
    /// <summary>
    /// Represents one file-backed language match produced by mp3li Additional Data Getter v2.
    /// </summary>
    public class LanguageMatch
    {
        public string NormalizedSongName { get; set; } = "";
        public string NormalizedArtistName { get; set; } = "";
        public string SongName { get; set; } = "";
        public string ArtistName { get; set; } = "";
        public string LyricsUrl { get; set; } = "";
        public List<string> Languages { get; set; } = [];
    }
}
