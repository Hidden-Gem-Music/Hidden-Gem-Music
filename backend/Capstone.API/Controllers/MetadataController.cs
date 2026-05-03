using Capstone.API.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Capstone.API.Controllers
{
    /// <summary>
    /// Serves shared metadata used by frontend controls.
    /// </summary>
    [ApiController]
    [Route("api/metadata")]
    public class MetadataController : ControllerBase
    {
        private readonly IMetadataRepository _repo;

        /// <summary>
        /// Initializes a new instance of MetadataController.
        /// </summary>
        public MetadataController(IMetadataRepository repo)
        {
            _repo = repo;
        }

        /// <summary>
        /// Returns available chart years that have data.
        /// GET /api/metadata/years
        /// </summary>
        [HttpGet("years")]
        public async Task<IActionResult> GetAvailableYears()
        {
            var years = await _repo.GetAvailableYearsAsync();
            return Ok(years);
        }
    }
}
