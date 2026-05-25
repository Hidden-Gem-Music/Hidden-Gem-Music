using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.Language;
using Microsoft.AspNetCore.Mvc;

namespace Capstone.API.Controllers
{
    [ApiController]
    [Route("api/language")]
    public class LanguageController : ControllerBase
    {
        private const int MaxLookupSongs = 100;

        private readonly ILanguageLookupService _languageLookupService;

        public LanguageController(ILanguageLookupService languageLookupService)
        {
            _languageLookupService = languageLookupService;
        }

        [HttpPost("songs")]
        public IActionResult GetSongLanguageMatches([FromBody] LanguageSongLookupRequest request)
        {
            var songs = request.Songs
                .Where((song) => !string.IsNullOrWhiteSpace(song.SongName) && !string.IsNullOrWhiteSpace(song.ArtistName))
                .Take(MaxLookupSongs)
                .ToList();

            return Ok(_languageLookupService.FindMatches(songs));
        }
    }
}
