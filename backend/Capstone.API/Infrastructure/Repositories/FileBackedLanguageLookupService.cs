using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.Language;
using Capstone.API.Models.Shared;

namespace Capstone.API.Infrastructure.Repositories
{
    public class FileBackedLanguageLookupService : ILanguageLookupService
    {
        private static readonly Regex NonAlphaNumericRegex = new("[^a-z0-9]+", RegexOptions.Compiled);
        private static readonly Regex WhitespaceRegex = new("\\s+", RegexOptions.Compiled);

        private readonly Lazy<Dictionary<string, LanguageMatch>> _matchesByKey;

        public FileBackedLanguageLookupService(IWebHostEnvironment environment, ILogger<FileBackedLanguageLookupService> logger)
        {
            _matchesByKey = new Lazy<Dictionary<string, LanguageMatch>>(() => LoadMatches(environment.ContentRootPath, logger));
        }

        public LanguageMatch? FindMatch(string? songName, string? artistName)
        {
            var key = BuildKey(songName, artistName);
            if (string.IsNullOrWhiteSpace(key))
            {
                return null;
            }

            return _matchesByKey.Value.TryGetValue(key, out var match) ? match : null;
        }

        public LanguageMatch? FindMatch(Song song)
        {
            return FindMatch(song.SongName, song.ArtistName);
        }

        public IReadOnlyList<LanguageSongMatch> FindMatches(IEnumerable<LanguageSongLookupItem> songs)
        {
            var results = new List<LanguageSongMatch>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var song in songs)
            {
                var key = BuildKey(song.SongName, song.ArtistName);
                if (string.IsNullOrWhiteSpace(key) || !seen.Add(key))
                {
                    continue;
                }

                var match = FindMatch(song.SongName, song.ArtistName);
                if (match is null)
                {
                    continue;
                }

                results.Add(new LanguageSongMatch
                {
                    SongName = song.SongName?.Trim() ?? match.SongName,
                    ArtistName = song.ArtistName?.Trim() ?? match.ArtistName,
                    LyricsUrl = match.LyricsUrl,
                    Languages = match.Languages
                });
            }

            return results;
        }

        private static Dictionary<string, LanguageMatch> LoadMatches(string contentRootPath, ILogger logger)
        {
            var path = Path.Combine(contentRootPath, "Data", "language_matches.json");
            if (!File.Exists(path))
            {
                logger.LogWarning("Language match file not found at {Path}", path);
                return new Dictionary<string, LanguageMatch>(StringComparer.OrdinalIgnoreCase);
            }

            using var stream = File.OpenRead(path);
            var matches = JsonSerializer.Deserialize<List<LanguageMatch>>(stream, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? [];

            var result = new Dictionary<string, LanguageMatch>(StringComparer.OrdinalIgnoreCase);
            foreach (var match in matches)
            {
                var key = BuildKey(match.NormalizedSongName, match.NormalizedArtistName, alreadyNormalized: true);
                if (string.IsNullOrWhiteSpace(key) || result.ContainsKey(key))
                {
                    continue;
                }

                match.Languages = match.Languages
                    .Where((language) => !string.IsNullOrWhiteSpace(language))
                    .Select((language) => language.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                if (match.Languages.Count == 0)
                {
                    continue;
                }

                result[key] = match;
            }

            logger.LogInformation("Loaded {Count} file-backed language matches.", result.Count);
            return result;
        }

        private static string BuildKey(string? songName, string? artistName, bool alreadyNormalized = false)
        {
            var normalizedSong = alreadyNormalized ? songName?.Trim() : Normalize(songName);
            var normalizedArtist = alreadyNormalized ? artistName?.Trim() : Normalize(artistName);
            return string.IsNullOrWhiteSpace(normalizedSong) || string.IsNullOrWhiteSpace(normalizedArtist)
                ? ""
                : $"{normalizedSong}::{normalizedArtist}";
        }

        private static string Normalize(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return "";
            }

            var normalized = value.Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(normalized.Length);
            foreach (var character in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(char.ToLowerInvariant(character));
                }
            }

            var withoutMarks = builder.ToString().Normalize(NormalizationForm.FormC).Trim();
            var alphaNumeric = NonAlphaNumericRegex.Replace(withoutMarks, " ");
            return WhitespaceRegex.Replace(alphaNumeric, " ").Trim();
        }
    }
}
