namespace Capstone.API.Models.Language
{
    public class LanguageSongMatch
    {
        public string SongName { get; set; } = "";
        public string ArtistName { get; set; } = "";
        public string LyricsUrl { get; set; } = "";
        public List<string> Languages { get; set; } = [];
    }
}
