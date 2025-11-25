using BetterMe.Api.DTOs.Task;
using BetterMe.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class RemindersController : ControllerBase
    {
        private readonly IReminderService _reminderService;
        private readonly AutoMapper.IMapper _mapper;

        public RemindersController(IReminderService reminderService, AutoMapper.IMapper mapper)
        {
            _reminderService = reminderService;
            _mapper = mapper;
        }

        [HttpPost]
        public async Task<IActionResult> CreateReminder([FromBody] CreateReminderRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            try
            {
                var reminder = await _reminderService.CreateReminderAsync(request, userId);
                var response = _mapper.Map<ReminderResponse>(reminder);
                return CreatedAtAction(nameof(GetReminder), new { id = reminder.Id }, response);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetReminder(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var reminders = await _reminderService.GetUserRemindersAsync(userId);
            var reminder = reminders.FirstOrDefault(r => r.Id == id);

            if (reminder == null)
                return NotFound();

            var response = _mapper.Map<ReminderResponse>(reminder);
            return Ok(response);
        }

        [HttpGet("task/{taskId:int}")]
        public async Task<IActionResult> GetTaskReminders(int taskId)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var reminders = await _reminderService.GetTaskRemindersAsync(taskId, userId);
            var responses = reminders.Select(r => _mapper.Map<ReminderResponse>(r)).ToList();
            return Ok(responses);
        }

        [HttpGet]
        public async Task<IActionResult> GetUserReminders()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var reminders = await _reminderService.GetUserRemindersAsync(userId);
            var responses = reminders.Select(r => _mapper.Map<ReminderResponse>(r)).ToList();
            return Ok(responses);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteReminder(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var deleted = await _reminderService.DeleteReminderAsync(id, userId);
            if (!deleted)
                return NotFound();

            return NoContent();
        }

        [HttpPatch("{id:int}/toggle")]
        public async Task<IActionResult> ToggleReminder(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (!int.TryParse(sub, out var userId))
                return Unauthorized();

            var toggled = await _reminderService.ToggleReminderActiveAsync(id, userId);
            if (!toggled)
                return NotFound();

            return Ok(new { message = "Reminder toggled successfully" });
        }
    }
}
