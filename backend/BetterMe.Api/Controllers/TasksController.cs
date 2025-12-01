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
using BetterMe.Api.Models;
using BetterMe.Api.Data;
using BetterMe.Api.Services.Concrete;
using Microsoft.EntityFrameworkCore;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITodoTaskService _taskService;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ICollaborationService _collaborationService;
        private readonly INaturalLanguageParser _naturalLanguageParser;

        public TasksController(ITodoTaskService taskService, IMapper mapper, AppDbContext context, IWebHostEnvironment environment, ICollaborationService collaborationService, INaturalLanguageParser naturalLanguageParser)
        {
            _taskService = taskService;
            _mapper = mapper;
            _context = context;
            _environment = environment;
            _collaborationService = collaborationService;
            _naturalLanguageParser = naturalLanguageParser;
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

        [HttpPost("parse")]
        public IActionResult ParseNaturalLanguage([FromBody] ParseTaskRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Input))
            {
                return BadRequest(new { message = "Input cannot be empty" });
            }

            var result = _naturalLanguageParser.ParseTaskInput(request.Input);
            return Ok(result);
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

            // Get owned tasks
            var ownedTasks = await _context.TodoTasks
                .Include(t => t.TaskTags)
                    .ThenInclude(tt => tt.Tag)
                .Include(t => t.Attachments)
                .Include(t => t.AssignedToUser)
                .Include(t => t.ParentTask)
                .Where(t => t.UserId == userId)
                .ToListAsync();

            // Get shared tasks
            var sharedTaskIds = await _context.SharedTasks
                .Where(st => st.SharedWithUserId == userId)
                .Select(st => st.TaskId)
                .ToListAsync();

            var sharedTasks = await _context.TodoTasks
                .Include(t => t.TaskTags)
                    .ThenInclude(tt => tt.Tag)
                .Include(t => t.Attachments)
                .Include(t => t.AssignedToUser)
                .Include(t => t.User)
                .Include(t => t.ParentTask)
                .Where(t => sharedTaskIds.Contains(t.Id))
                .ToListAsync();

            // Combine and map
            var allTasks = ownedTasks.Concat(sharedTasks).DistinctBy(t => t.Id).ToList();
            
            // Only get root tasks (tasks without a parent)
            var rootTasks = allTasks.Where(t => !t.ParentTaskId.HasValue).ToList();
            
            // Build task responses with subtasks and dependencies (recursive)
            var dtos = new List<TaskResponse>();
            foreach (var task in rootTasks)
            {
                var dto = await TaskHierarchyHelper.BuildTaskResponseAsync(task, _context, userId, _mapper);
                dto.AssignedToUserId = task.AssignedToUserId;
                dto.AssignedToUserName = task.AssignedToUser?.Name;
                dto.IsShared = task.UserId != userId || sharedTaskIds.Contains(task.Id);
                dto.CommentCount = await _context.TaskComments.CountAsync(c => c.TaskId == task.Id);
                dtos.Add(dto);
            }

            return Ok(dtos);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var task = await _context.TodoTasks
                .Include(t => t.TaskTags)
                    .ThenInclude(tt => tt.Tag)
                .Include(t => t.Attachments)
                .Include(t => t.AssignedToUser)
                .Include(t => t.ParentTask)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null) return NotFound();

            // Check if user can access (owner or shared)
            if (!await _collaborationService.CanUserAccessTaskAsync(id, userId))
                return Forbid();

            var dto = await TaskHierarchyHelper.BuildTaskResponseAsync(task, _context, userId, _mapper);
            dto.AssignedToUserId = task.AssignedToUserId;
            dto.AssignedToUserName = task.AssignedToUser?.Name;
            dto.IsShared = task.UserId != userId;
            dto.CommentCount = await _context.TaskComments.CountAsync(c => c.TaskId == id);

            return Ok(dto);
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

        [HttpPost("{id:int}/add-to-my-day")]
        public async Task<IActionResult> AddTaskToMyDay(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var success = await _taskService.AddTaskToMyDayAsync(id, userId);
            if (!success) return NotFound();

            var task = await _taskService.GetByIdAsync(id);
            return Ok(_mapper.Map<TaskResponse>(task));
        }

        [HttpPost("{id:int}/remove-from-my-day")]
        public async Task<IActionResult> RemoveTaskFromMyDay(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var success = await _taskService.RemoveTaskFromMyDayAsync(id, userId);
            if (!success) return NotFound();

            var task = await _taskService.GetByIdAsync(id);
            return Ok(_mapper.Map<TaskResponse>(task));
        }

        [HttpGet("my-day")]
        public async Task<IActionResult> GetMyDayTasks()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var tasks = await _taskService.GetMyDayTasksAsync(userId);
            return Ok(_mapper.Map<List<TaskResponse>>(tasks));
        }

        [HttpGet("my-day/suggestions")]
        public async Task<IActionResult> GetSuggestedTasksForMyDay()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var tasks = await _taskService.GetSuggestedTasksForMyDayAsync(userId);
            return Ok(_mapper.Map<List<TaskResponse>>(tasks));
        }

        [HttpPost("search")]
        public async Task<IActionResult> SearchTasks([FromBody] SearchTasksRequest request)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var (tasks, totalCount) = await _taskService.SearchTasksAsync(request, userId);
            var dtos = _mapper.Map<List<TaskResponse>>(tasks);

            return Ok(new
            {
                Tasks = dtos,
                TotalCount = totalCount,
                Page = request.Page ?? 1,
                PageSize = request.PageSize ?? 100,
                TotalPages = (int)Math.Ceiling(totalCount / (double)(request.PageSize ?? 100))
            });
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchTasksGet([FromQuery] string? searchTerm,
            [FromQuery] string? category,
            [FromQuery] bool? completed,
            [FromQuery] int? priority,
            [FromQuery] List<string>? tags,
            [FromQuery] string? tagLogic,
            [FromQuery] DateTime? dueDateFrom,
            [FromQuery] DateTime? dueDateTo,
            [FromQuery] DateTime? createdFrom,
            [FromQuery] DateTime? createdTo,
            [FromQuery] bool? hasDueDate,
            [FromQuery] bool? isOverdue,
            [FromQuery] bool? isDueToday,
            [FromQuery] bool? isRecurring,
            [FromQuery] string? sortBy,
            [FromQuery] string? sortDirection,
            [FromQuery] int? page,
            [FromQuery] int? pageSize)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var request = new SearchTasksRequest
            {
                SearchTerm = searchTerm,
                Category = category,
                Completed = completed,
                Priority = priority,
                Tags = tags,
                TagLogic = tagLogic,
                DueDateFrom = dueDateFrom,
                DueDateTo = dueDateTo,
                CreatedFrom = createdFrom,
                CreatedTo = createdTo,
                HasDueDate = hasDueDate,
                IsOverdue = isOverdue,
                IsDueToday = isDueToday,
                IsRecurring = isRecurring,
                SortBy = sortBy,
                SortDirection = sortDirection,
                Page = page,
                PageSize = pageSize
            };

            var (tasks, totalCount) = await _taskService.SearchTasksAsync(request, userId);
            var dtos = _mapper.Map<List<TaskResponse>>(tasks);

            return Ok(new
            {
                Tasks = dtos,
                TotalCount = totalCount,
                Page = request.Page ?? 1,
                PageSize = request.PageSize ?? 100,
                TotalPages = (int)Math.Ceiling(totalCount / (double)(request.PageSize ?? 100))
            });
        }

        [HttpPost("{id:int}/attachments")]
        public async Task<IActionResult> UploadAttachment(int id, IFormFile file)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var task = await _taskService.GetByIdAsync(id);
            if (task == null || task.UserId != userId) return NotFound();

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            // Validate file size (max 10MB)
            const long maxFileSize = 10 * 1024 * 1024; // 10MB
            if (file.Length > maxFileSize)
                return BadRequest(new { message = "File size exceeds 10MB limit" });

            // Create uploads directory if it doesn't exist
            var uploadsPath = Path.Combine(_environment.ContentRootPath, "uploads", "attachments");
            if (!Directory.Exists(uploadsPath))
                Directory.CreateDirectory(uploadsPath);

            // Generate unique filename
            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsPath, uniqueFileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create attachment record
            var attachment = new TaskAttachment
            {
                TodoTaskId = id,
                Filename = file.FileName,
                FilePath = filePath,
                ContentType = file.ContentType,
                FileSize = file.Length,
                UploadedAt = DateTime.UtcNow,
                Url = null // Will be set by AutoMapper or after save
            };

            _context.TaskAttachments.Add(attachment);
            await _context.SaveChangesAsync();

            return Ok(_mapper.Map<AttachmentResponse>(attachment));
        }

        [HttpGet("{id:int}/attachments")]
        public async Task<IActionResult> GetAttachments(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var task = await _taskService.GetByIdAsync(id);
            if (task == null || task.UserId != userId) return NotFound();

            var attachments = await _context.TaskAttachments
                .Where(a => a.TodoTaskId == id)
                .ToListAsync();

            return Ok(_mapper.Map<List<AttachmentResponse>>(attachments));
        }

        [HttpGet("{taskId:int}/attachments/{attachmentId:int}")]
        public async Task<IActionResult> DownloadAttachment(int taskId, int attachmentId)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var task = await _taskService.GetByIdAsync(taskId);
            if (task == null || task.UserId != userId) return NotFound();

            var attachment = await _context.TaskAttachments
                .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TodoTaskId == taskId);

            if (attachment == null) return NotFound();

            if (!System.IO.File.Exists(attachment.FilePath))
                return NotFound(new { message = "File not found on server" });

            var fileBytes = await System.IO.File.ReadAllBytesAsync(attachment.FilePath);
            return File(fileBytes, attachment.ContentType, attachment.Filename);
        }

        [HttpDelete("{taskId:int}/attachments/{attachmentId:int}")]
        public async Task<IActionResult> DeleteAttachment(int taskId, int attachmentId)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            var task = await _taskService.GetByIdAsync(taskId);
            if (task == null || task.UserId != userId) return NotFound();

            var attachment = await _context.TaskAttachments
                .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TodoTaskId == taskId);

            if (attachment == null) return NotFound();

            // Delete physical file
            if (System.IO.File.Exists(attachment.FilePath))
            {
                System.IO.File.Delete(attachment.FilePath);
            }

            _context.TaskAttachments.Remove(attachment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        public class CompleteInstanceRequest
        {
            public DateTime? CompletionDate { get; set; }
        }
    }
}