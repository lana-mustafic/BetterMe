using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using ToDoApi.DTOs.Task;
using ToDoApi.Services.Interfaces;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using ToDoApi.Services;

namespace ToDoApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // protect all endpoints here by default
    public class TasksController : ControllerBase
    {
        private readonly ITodoTaskService _taskService;
        private readonly IMapper _mapper;

        public TasksController(ITodoTaskService taskService, IMapper mapper)
        {
            _taskService = taskService;
            _mapper = mapper;
        }

        // ADD THIS DEBUG ENDPOINT
        [HttpGet("debug")]
        public IActionResult Debug()
        {
            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();

            return Ok(new
            {
                Claims = claims,
                AuthorizationHeader = authHeader,
                IsAuthenticated = User.Identity.IsAuthenticated,
                IdentityName = User.Identity.Name
            });
        }

        // POST: api/tasks
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTaskRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
            {
                return Unauthorized(new { message = "Invalid user ID in token" });
            }

            var taskEntity = await _taskService.CreateTaskAsync(req, userId);
            var dto = _mapper.Map<TaskResponse>(taskEntity);

            return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
        }

        [HttpGet("test-simple")]
        public IActionResult TestSimple()
        {
            // Simple test - just return the first claim we can find
            var claims = User.Claims.ToList();
            if (claims.Any())
            {
                return Ok(new
                {
                    Message = "Token is valid",
                    FirstClaim = new { Type = claims[0].Type, Value = claims[0].Value }
                });
            }
            return Unauthorized(new { Message = "No claims found" });
        }

        // GET: api/tasks
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // FIXED: Use ClaimTypes.NameIdentifier instead of JwtRegisteredClaimNames.Sub
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            Console.WriteLine($"[DEBUG TASKS GETALL] Sub claim value: {sub}");

            if (!int.TryParse(sub, out var userId))
            {
                Console.WriteLine($"[DEBUG TASKS GETALL] Failed to parse sub: {sub}");
                return Unauthorized();
            }

            var tasks = await _taskService.GetAllTasksByUserAsync(userId);
            var dtos = _mapper.Map<List<TaskResponse>>(tasks);
            return Ok(dtos);
        }

        // GET: api/tasks/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            // FIXED: Use ClaimTypes.NameIdentifier instead of JwtRegisteredClaimNames.Sub
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var task = await _taskService.GetByIdAsync(id); // implement this on service if needed
            if (task == null) return NotFound();
            if (task.UserId != userId) return Forbid();

            return Ok(_mapper.Map<TaskResponse>(task));
        }

        // PATCH: api/tasks/{id}
        [HttpPatch("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTaskRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // FIXED: Use ClaimTypes.NameIdentifier instead of JwtRegisteredClaimNames.Sub
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var updated = await _taskService.UpdateTaskAsync(id, req, userId); // implement in service
            if (updated == null) return NotFound(); // or Forbid if ownership fails
            return Ok(_mapper.Map<TaskResponse>(updated));
        }

        // DELETE: api/tasks/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            // FIXED: Use ClaimTypes.NameIdentifier instead of JwtRegisteredClaimNames.Sub
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var removed = await _taskService.DeleteTaskAsync(id, userId); // implement in service
            if (!removed) return NotFound();
            return NoContent();
        }
    }
}