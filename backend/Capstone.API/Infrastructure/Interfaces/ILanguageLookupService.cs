using Capstone.API.Models.Language;
using Capstone.API.Models.Shared;

namespace Capstone.API.Infrastructure.Interfaces
{
    public interface ILanguageLookupService
    {
        LanguageMatch? FindMatch(string? songName, string? artistName);
        LanguageMatch? FindMatch(Song song);
        IReadOnlyList<LanguageSongMatch> FindMatches(IEnumerable<LanguageSongLookupItem> songs);
    }
}
