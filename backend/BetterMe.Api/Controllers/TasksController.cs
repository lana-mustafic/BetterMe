using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BetterMe.Api.DTOs.Task;
using BetterMe.Api.Services.Interfaces;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using BetterMe.Api.Services;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITodoTaskService _taskService;
        private readonly IMapper _mapper;

        public TasksController(ITodoTaskService taskService, IMapper mapper)
        {
            _taskService = taskService;
            _mapper = mapper;
        }

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

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
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

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var task = await _taskService.GetByIdAsync(id);
            if (task == null) return NotFound();
            if (task.UserId != userId) return Forbid();

            return Ok(_mapper.Map<TaskResponse>(task));
        }

        // FIXED: Changed from HttpPatch to HttpPut
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateTaskRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var updated = await _taskService.UpdateTaskAsync(id, req, userId);
            if (updated == null) return NotFound();
            return Ok(_mapper.Map<TaskResponse>(updated));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var removed = await _taskService.DeleteTaskAsync(id, userId);
            if (!removed) return NotFound();
            return NoContent();
        }

        [HttpPost("{id:int}/complete-instance")]
        public async Task<IActionResult> CompleteRecurringInstance(int id, [FromBody] CompleteInstanceRequest request)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var completionDate = request.CompletionDate ?? DateTime.UtcNow;
            var updatedTask = await _taskService.CompleteRecurringInstanceAsync(id, userId, completionDate);

            if (updatedTask == null) return NotFound();

            return Ok(_mapper.Map<TaskResponse>(updatedTask));
        }

        [HttpGet("{id:int}/streak")]
        public async Task<IActionResult> GetHabitStreak(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var task = await _taskService.GetByIdAsync(id);
            if (task == null || task.UserId != userId) return NotFound();

            var streak = await _taskService.CalculateHabitStreakAsync(id);
            return Ok(new { streak });
        }

        [HttpGet("habits")]
        public async Task<IActionResult> GetHabits()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var allTasks = await _taskService.GetAllTasksByUserAsync(userId);
            var habits = allTasks.Where(t => t.IsRecurring && t.RecurrencePattern != "none").ToList();

            return Ok(_mapper.Map<List<TaskResponse>>(habits));
        }

        public class CompleteInstanceRequest
        {
            public DateTime? CompletionDate { get; set; }
        }
    }
}