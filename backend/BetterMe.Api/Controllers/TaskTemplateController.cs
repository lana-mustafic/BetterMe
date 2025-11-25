using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BetterMe.Api.DTOs.Task;
using BetterMe.Api.Services.Interfaces;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TaskTemplateController : ControllerBase
    {
        private readonly ITaskTemplateService _templateService;
        private readonly IMapper _mapper;

        public TaskTemplateController(ITaskTemplateService templateService, IMapper mapper)
        {
            _templateService = templateService;
            _mapper = mapper;
        }

        private int GetUserId()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
            {
                throw new UnauthorizedAccessException("Invalid user ID in token");
            }

            return userId;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTemplate([FromBody] CreateTaskTemplateRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var userId = GetUserId();
                var template = await _templateService.CreateTemplateAsync(request, userId);
                var response = _mapper.Map<TaskTemplateResponse>(template);
                return CreatedAtAction(nameof(GetById), new { id = response.Id }, response);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();
            var templates = await _templateService.GetAllTemplatesAsync(userId);
            var responses = templates.Select(t => _mapper.Map<TaskTemplateResponse>(t)).ToList();
            return Ok(responses);
        }

        [HttpGet("favorites")]
        public async Task<IActionResult> GetFavorites()
        {
            var userId = GetUserId();
            var templates = await _templateService.GetFavoriteTemplatesAsync(userId);
            var responses = templates.Select(t => _mapper.Map<TaskTemplateResponse>(t)).ToList();
            return Ok(responses);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = GetUserId();
            var template = await _templateService.GetTemplateByIdAsync(id, userId);

            if (template == null)
            {
                return NotFound();
            }

            var response = _mapper.Map<TaskTemplateResponse>(template);
            return Ok(response);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTaskTemplateRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var userId = GetUserId();
                var template = await _templateService.UpdateTemplateAsync(id, request, userId);
                var response = _mapper.Map<TaskTemplateResponse>(template);
                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            var deleted = await _templateService.DeleteTemplateAsync(id, userId);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpPost("{id:int}/create-task")]
        public async Task<IActionResult> CreateTaskFromTemplate(int id, [FromBody] CreateTaskFromTemplateRequest? request = null)
        {
            try
            {
                var userId = GetUserId();
                var dueDate = request?.DueDate;
                var task = await _templateService.CreateTaskFromTemplateAsync(id, userId, dueDate);
                var response = _mapper.Map<TaskResponse>(task);
                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id:int}/toggle-favorite")]
        public async Task<IActionResult> ToggleFavorite(int id)
        {
            try
            {
                var userId = GetUserId();
                var template = await _templateService.ToggleFavoriteAsync(id, userId);
                var response = _mapper.Map<TaskTemplateResponse>(template);
                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        public class CreateTaskFromTemplateRequest
        {
            public DateTime? DueDate { get; set; }
        }
    }
}

