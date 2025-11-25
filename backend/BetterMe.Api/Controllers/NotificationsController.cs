using BetterMe.Api.Data;
using BetterMe.Api.DTOs.Notification;
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
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AutoMapper.IMapper _mapper;

        public NotificationsController(AppDbContext context, AutoMapper.IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] bool? unreadOnly = false)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var query = _context.Notifications
                .Where(n => n.UserId == userId)
                .Include(n => n.Task)
                .OrderByDescending(n => n.CreatedAt);

            if (unreadOnly == true)
            {
                query = query.Where(n => !n.IsRead) as IOrderedQueryable<Notification>;
            }

            var notifications = await query.Take(100).ToListAsync();
            var responses = notifications.Select(n => new NotificationResponse
            {
                Id = n.Id,
                Title = n.Title,
                Message = n.Message,
                Type = n.Type,
                TaskId = n.TaskId,
                TaskTitle = n.Task?.Title,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                ReadAt = n.ReadAt,
                ActionUrl = n.ActionUrl
            }).ToList();

            return Ok(responses);
        }

        [HttpGet("unread/count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var count = await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);

            return Ok(new { count });
        }

        [HttpPatch("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
                return NotFound();

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notification marked as read" });
        }

        [HttpPatch("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "All notifications marked as read", count = notifications.Count });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (notification == null)
                return NotFound();

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}

