using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BetterMe.Api.DTOs.Focus;
using BetterMe.Api.Services.Interfaces;
using BetterMe.Api.Models;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FocusSessionController : ControllerBase
    {
        private readonly IFocusSessionService _focusSessionService;
        private readonly IMapper _mapper;

        public FocusSessionController(IFocusSessionService focusSessionService, IMapper mapper)
        {
            _focusSessionService = focusSessionService;
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

        [HttpPost("start")]
        public async Task<IActionResult> StartSession([FromBody] StartSessionRequest request)
        {
            try
            {
                var userId = GetUserId();
                var session = await _focusSessionService.StartSessionAsync(
                    userId,
                    request.TaskId,
                    request.SessionType,
                    request.DurationMinutes
                );

                var response = _mapper.Map<FocusSessionResponse>(session);
                if (session.Task != null)
                {
                    response.TaskTitle = session.Task.Title;
                }
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActiveSession()
        {
            var userId = GetUserId();
            var session = await _focusSessionService.GetActiveSessionAsync(userId);

            if (session == null)
            {
                return NotFound(new { message = "No active session found" });
            }

            var response = _mapper.Map<FocusSessionResponse>(session);
            if (session.Task != null)
            {
                response.TaskTitle = session.Task.Title;
            }
            return Ok(response);
        }

        [HttpPost("{id:int}/complete")]
        public async Task<IActionResult> CompleteSession(int id, [FromBody] CompleteSessionRequest? request = null)
        {
            try
            {
                var userId = GetUserId();
                var wasInterrupted = request?.WasInterrupted ?? false;
                var session = await _focusSessionService.CompleteSessionAsync(id, userId, wasInterrupted);

                var response = _mapper.Map<FocusSessionResponse>(session);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetSessions([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var userId = GetUserId();
            var sessions = await _focusSessionService.GetUserSessionsAsync(userId, startDate, endDate);

            var responses = sessions.Select(s => _mapper.Map<FocusSessionResponse>(s)).ToList();
            return Ok(responses);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var userId = GetUserId();
            var stats = await _focusSessionService.GetSessionStatsAsync(userId, startDate, endDate);

            var response = _mapper.Map<FocusSessionStatsResponse>(stats);
            return Ok(response);
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var userId = GetUserId();
            var settings = await _focusSessionService.GetPomodoroSettingsAsync(userId);

            var response = _mapper.Map<PomodoroSettingsResponse>(settings);
            return Ok(response);
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] PomodoroSettingsResponse request)
        {
            var userId = GetUserId();
            var settings = _mapper.Map<PomodoroSettings>(request);
            var updated = await _focusSessionService.UpdatePomodoroSettingsAsync(userId, settings);

            var response = _mapper.Map<PomodoroSettingsResponse>(updated);
            return Ok(response);
        }

        public class CompleteSessionRequest
        {
            public bool WasInterrupted { get; set; } = false;
            public string? Notes { get; set; }
        }
    }
}

