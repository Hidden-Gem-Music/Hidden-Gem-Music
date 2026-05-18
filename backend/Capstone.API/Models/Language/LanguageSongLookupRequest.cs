namespace Capstone.API.Models.Language
{
    public class LanguageSongLookupRequest
    {
        public List<LanguageSongLookupItem> Songs { get; set; } = [];
    }

    public class LanguageSongLookupItem
    {
        public string? SongName { get; set; }
        public string? ArtistName { get; set; }
    }
}
