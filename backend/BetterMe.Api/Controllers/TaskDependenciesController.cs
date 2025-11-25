using BetterMe.Api.Data;
using BetterMe.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TaskDependenciesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TaskDependenciesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateDependency([FromBody] CreateDependencyRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            // Verify both tasks belong to user
            var task = await _context.TodoTasks.FirstOrDefaultAsync(t => t.Id == request.TaskId && t.UserId == userId);
            var dependsOnTask = await _context.TodoTasks.FirstOrDefaultAsync(t => t.Id == request.DependsOnTaskId && t.UserId == userId);

            if (task == null || dependsOnTask == null)
                return NotFound(new { message = "One or both tasks not found" });

            if (request.TaskId == request.DependsOnTaskId)
                return BadRequest(new { message = "Task cannot depend on itself" });

            // Check for circular dependencies
            if (await HasCircularDependency(request.TaskId, request.DependsOnTaskId))
                return BadRequest(new { message = "Circular dependency detected" });

            // Check if dependency already exists
            var existing = await _context.TaskDependencies
                .FirstOrDefaultAsync(td => td.TaskId == request.TaskId && td.DependsOnTaskId == request.DependsOnTaskId);

            if (existing != null)
                return Conflict(new { message = "Dependency already exists" });

            var dependency = new TaskDependency
            {
                TaskId = request.TaskId,
                DependsOnTaskId = request.DependsOnTaskId,
                DependencyType = request.DependencyType ?? "blocks",
                CreatedAt = DateTime.UtcNow
            };

            _context.TaskDependencies.Add(dependency);
            await _context.SaveChangesAsync();

            return Ok(new { id = dependency.Id, message = "Dependency created successfully" });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDependency(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var dependency = await _context.TaskDependencies
                .Include(td => td.Task)
                .FirstOrDefaultAsync(td => td.Id == id && td.Task.UserId == userId);

            if (dependency == null)
                return NotFound();

            _context.TaskDependencies.Remove(dependency);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("task/{taskId:int}")]
        public async Task<IActionResult> GetTaskDependencies(int taskId)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var task = await _context.TodoTasks.FirstOrDefaultAsync(t => t.Id == taskId && t.UserId == userId);
            if (task == null) return NotFound();

            var dependencies = await _context.TaskDependencies
                .Include(td => td.DependsOnTask)
                .Where(td => td.TaskId == taskId)
                .Select(td => new
                {
                    id = td.Id,
                    dependsOnTaskId = td.DependsOnTaskId,
                    dependsOnTaskTitle = td.DependsOnTask.Title,
                    isCompleted = td.DependsOnTask.Completed,
                    dependencyType = td.DependencyType
                })
                .ToListAsync();

            return Ok(dependencies);
        }

        private async Task<bool> HasCircularDependency(int taskId, int dependsOnTaskId)
        {
            // Check if dependsOnTaskId has a dependency chain that leads back to taskId
            var visited = new HashSet<int> { dependsOnTaskId };
            var queue = new Queue<int>();
            queue.Enqueue(dependsOnTaskId);

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                if (current == taskId) return true;

                var dependencies = await _context.TaskDependencies
                    .Where(td => td.TaskId == current)
                    .Select(td => td.DependsOnTaskId)
                    .ToListAsync();

                foreach (var dep in dependencies)
                {
                    if (!visited.Contains(dep))
                    {
                        visited.Add(dep);
                        queue.Enqueue(dep);
                    }
                }
            }

            return false;
        }
    }

    public class CreateDependencyRequest
    {
        public int TaskId { get; set; }
        public int DependsOnTaskId { get; set; }
        public string? DependencyType { get; set; } = "blocks";
    }
}

