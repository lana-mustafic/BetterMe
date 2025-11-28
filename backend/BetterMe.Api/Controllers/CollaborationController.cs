using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BetterMe.Api.DTOs.Collaboration;
using BetterMe.Api.Services.Interfaces;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [EnableCors("AllowFrontend")]
    public class CollaborationController : ControllerBase
    {
        private readonly ICollaborationService _collaborationService;

        public CollaborationController(ICollaborationService collaborationService)
        {
            _collaborationService = collaborationService;
        }

        private int GetUserId()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId))
                throw new UnauthorizedAccessException("Invalid user ID in token");
            return userId;
        }

        // Sharing endpoints
        [HttpPost("tasks/{taskId}/share")]
        public async Task<IActionResult> ShareTask(int taskId, [FromBody] ShareTaskRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var userId = GetUserId();
                var share = await _collaborationService.ShareTaskAsync(taskId, userId, request);
                return Ok(new { message = "Task shared successfully", shareId = share.Id });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("tasks/{taskId}/share/{sharedWithUserId}")]
        public async Task<IActionResult> UnshareTask(int taskId, int sharedWithUserId)
        {
            try
            {
                var userId = GetUserId();
                var result = await _collaborationService.UnshareTaskAsync(taskId, userId, sharedWithUserId);
                if (!result) return NotFound();
                return Ok(new { message = "Task unshared successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpGet("tasks/shared")]
        public async Task<IActionResult> GetSharedTasks()
        {
            var userId = GetUserId();
            var shares = await _collaborationService.GetSharedTasksAsync(userId);
            return Ok(shares);
        }

        [HttpGet("tasks/{taskId}/shares")]
        public async Task<IActionResult> GetTaskShares(int taskId)
        {
            try
            {
                var userId = GetUserId();
                var shares = await _collaborationService.GetTaskSharesAsync(taskId, userId);
                return Ok(shares);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        // Assignment endpoints
        [HttpPost("tasks/{taskId}/assign")]
        public async Task<IActionResult> AssignTask(int taskId, [FromBody] AssignTaskRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var userId = GetUserId();
                await _collaborationService.AssignTaskAsync(taskId, userId, request.AssignedToUserId);
                return Ok(new { message = "Task assigned successfully" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Comment endpoints
        [HttpPost("tasks/{taskId}/comments")]
        public async Task<IActionResult> CreateComment(int taskId, [FromBody] CreateCommentRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var userId = GetUserId();
                var comment = await _collaborationService.CreateCommentAsync(taskId, userId, request);
                return CreatedAtAction(nameof(GetComment), new { taskId, commentId = comment.Id }, comment);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpGet("tasks/{taskId}/comments")]
        public async Task<IActionResult> GetComments(int taskId)
        {
            try
            {
                var userId = GetUserId();
                var comments = await _collaborationService.GetTaskCommentsAsync(taskId, userId);
                return Ok(comments);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpPut("comments/{commentId}")]
        public async Task<IActionResult> UpdateComment(int commentId, [FromBody] UpdateCommentRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var userId = GetUserId();
                var comment = await _collaborationService.UpdateCommentAsync(commentId, userId, request.Content);
                return Ok(comment);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpDelete("comments/{commentId}")]
        public async Task<IActionResult> DeleteComment(int commentId)
        {
            try
            {
                var userId = GetUserId();
                var result = await _collaborationService.DeleteCommentAsync(commentId, userId);
                if (!result) return NotFound();
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }

        [HttpGet("comments/{commentId}")]
        public async Task<IActionResult> GetComment(int commentId)
        {
            // This would require a GetCommentById method in the service
            // For now, return not implemented
            return StatusCode(501, new { message = "Not implemented" });
        }

        // Activity endpoints
        [HttpGet("tasks/{taskId}/activities")]
        public async Task<IActionResult> GetActivities(int taskId)
        {
            try
            {
                var userId = GetUserId();
                var activities = await _collaborationService.GetTaskActivitiesAsync(taskId, userId);
                return Ok(activities);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
        }
    }

    public class UpdateCommentRequest
    {
        public string Content { get; set; } = string.Empty;
    }
}

