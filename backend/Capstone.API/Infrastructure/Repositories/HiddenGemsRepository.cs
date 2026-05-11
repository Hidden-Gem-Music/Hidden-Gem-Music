using Capstone.API.Infrastructure.Interfaces;
using Capstone.API.Models.HiddenGems;

namespace Capstone.API.Infrastructure.Repositories
{
    /// <summary>
    /// Retrieves paginated hidden gems by calling sp_GetHiddenGems.
    /// Pagination is handled entirely in the stored procedure via @Offset and @PageSize —
    /// never in application code.
    /// </summary>
    public class HiddenGemsRepository : IHiddenGemsRepository
    {
        private readonly IDataRepository _db;
        private readonly IDeezerSongEnrichmentService _deezerSongEnrichmentService;

        /// <summary>
        /// Initializes a new instance of HiddenGemsRepository using the default connection.
        /// </summary>
        public HiddenGemsRepository(
            IDataRepositoryFactory factory,
            IDeezerSongEnrichmentService deezerSongEnrichmentService)
        {
            _db = factory.Create("DefaultConnection");
            _deezerSongEnrichmentService = deezerSongEnrichmentService;
        }

        /// <inheritdoc/>
        public async Task<HiddenGemResponse> GetHiddenGemsAsync(
            string countryCode, int year, int minCountries, int page, int pageSize, CancellationToken cancellationToken = default)
        {
            var requestedStartIndex = (page - 1) * pageSize;
            var requestedEndIndexExclusive = requestedStartIndex + pageSize;
            var resolvedRowsNeededToDetectNextPage = requestedEndIndexExclusive + 1;
            var scanOffset = 0;
            var rawBatchSize = Math.Max(pageSize * 3, 50);
            var totalRawCount = 0;
            var totalResolvedCount = 0;
            var resolvedPageItems = new List<HiddenGem>();
            var reachedResolvedPageBoundary = false;

            while (true)
            {
                cancellationToken.ThrowIfCancellationRequested();
                var rows = (await _db.GetDataAsync("sp_GetHiddenGems", new Dictionary<string, object?>
                {
                    { "@CountryCode", countryCode },
                    { "@Year", year },
                    { "@MinCountries", minCountries },
                    { "@Offset", scanOffset },
                    { "@PageSize", rawBatchSize }
                })).ToList();

                if (rows.Count == 0)
                {
                    break;
                }

                totalRawCount = RowValueReader.AsIntAny(rows[0], "total_count", "TotalCount");

                foreach (var row in rows)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    var enriched = await _deezerSongEnrichmentService.EnrichHiddenGemAsync(MapRow(row), cancellationToken);
                    if (enriched is null)
                    {
                        continue;
                    }

                    if (totalResolvedCount >= requestedStartIndex && totalResolvedCount < requestedEndIndexExclusive)
                    {
                        resolvedPageItems.Add(enriched);
                    }

                    totalResolvedCount++;

                    if (totalResolvedCount >= resolvedRowsNeededToDetectNextPage)
                    {
                        reachedResolvedPageBoundary = true;
                        break;
                    }
                }

                if (reachedResolvedPageBoundary)
                {
                    break;
                }

                scanOffset += rows.Count;
                if (scanOffset >= totalRawCount)
                {
                    break;
                }
            }

            var hasMore = requestedEndIndexExclusive < totalRawCount;

            return new HiddenGemResponse
            {
                Items = resolvedPageItems,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalRawCount,
                HasMore = hasMore
            };
        }

        private static HiddenGem MapRow(IDictionary<string, object?> row)
        {
            return new HiddenGem
            {
                // Keep current preferred keys first, but accept star-schema aliases when present.
                SongName = RowValueReader.AsStringAny(row, "song_name", "song_title", "title"),
                AlbumName = RowValueReader.AsStringAny(row, "album_name"),
                ArtistName = RowValueReader.AsStringAny(row, "artist_name"),
                Genre = RowValueReader.AsStringAny(row, "genre"),
                PreviewUrl = RowValueReader.AsStringAny(row, "preview_url", "spotify_id"),
                TrendScore = RowValueReader.AsDecimalAny(row, "trend_score"),
                CountriesChartingCount = RowValueReader.AsIntAny(row, "countries_charting_count", "countries_charting", "country_count")
            };
        }
    }
}
