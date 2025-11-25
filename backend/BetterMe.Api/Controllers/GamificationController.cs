using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using BetterMe.Api.Services.Interfaces;
using BetterMe.Api.Models;
using BetterMe.Models;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GamificationController : ControllerBase
    {
        private readonly IGamificationService _gamificationService;

        public GamificationController(IGamificationService gamificationService)
        {
            _gamificationService = gamificationService;
        }

        [HttpGet("stats")]
        public async Task<ActionResult<ApiResponse<GamificationStatsResponse>>> GetStats()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            try
            {
                var stats = await _gamificationService.GetGamificationStatsAsync(userId);
                return Ok(new ApiResponse<GamificationStatsResponse>
                {
                    Success = true,
                    Message = "Gamification stats retrieved successfully",
                    Data = stats
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<GamificationStatsResponse>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        [HttpGet("level-system")]
        public async Task<ActionResult<ApiResponse<LevelSystemResponse>>> GetLevelSystem()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            try
            {
                var levelSystem = await _gamificationService.GetUnifiedLevelSystemAsync(userId);
                return Ok(new ApiResponse<LevelSystemResponse>
                {
                    Success = true,
                    Message = "Level system retrieved successfully",
                    Data = levelSystem
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<LevelSystemResponse>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        [HttpGet("achievements")]
        public async Task<ActionResult<ApiResponse<List<UserAchievementResponse>>>> GetAchievements([FromQuery] bool includeUnlocked = true)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            try
            {
                var achievements = await _gamificationService.GetUserAchievementsAsync(userId, includeUnlocked);
                var response = achievements.Select(ua => new UserAchievementResponse
                {
                    Id = ua.Id,
                    AchievementId = ua.AchievementId,
                    Code = ua.Achievement.Code,
                    Name = ua.Achievement.Name,
                    Description = ua.Achievement.Description,
                    Icon = ua.Achievement.Icon,
                    Category = ua.Achievement.Category,
                    UnlockedAt = ua.UnlockedAt,
                    IsNew = ua.IsNew
                }).ToList();

                return Ok(new ApiResponse<List<UserAchievementResponse>>
                {
                    Success = true,
                    Message = "Achievements retrieved successfully",
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<List<UserAchievementResponse>>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        [HttpGet("achievements/new")]
        public async Task<ActionResult<ApiResponse<List<UserAchievementResponse>>>> GetNewAchievements()
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            try
            {
                var achievements = await _gamificationService.GetUserAchievementsAsync(userId, includeUnlocked: false);
                var response = achievements.Select(ua => new UserAchievementResponse
                {
                    Id = ua.Id,
                    AchievementId = ua.AchievementId,
                    Code = ua.Achievement.Code,
                    Name = ua.Achievement.Name,
                    Description = ua.Achievement.Description,
                    Icon = ua.Achievement.Icon,
                    Category = ua.Achievement.Category,
                    UnlockedAt = ua.UnlockedAt,
                    IsNew = ua.IsNew
                }).ToList();

                return Ok(new ApiResponse<List<UserAchievementResponse>>
                {
                    Success = true,
                    Message = "New achievements retrieved successfully",
                    Data = response
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<List<UserAchievementResponse>>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        [HttpPost("achievements/{id:int}/mark-read")]
        public async Task<ActionResult<ApiResponse<bool>>> MarkAchievementAsRead(int id)
        {
            var sub = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                      User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (!int.TryParse(sub, out var userId)) return Unauthorized();

            try
            {
                await _gamificationService.MarkAchievementAsReadAsync(id, userId);
                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Achievement marked as read",
                    Data = true
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<bool>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        [HttpGet("leaderboard")]
        public async Task<ActionResult<ApiResponse<List<LeaderboardEntry>>>> GetLeaderboard([FromQuery] int limit = 10)
        {
            try
            {
                var leaderboard = await _gamificationService.GetLeaderboardAsync(limit);
                return Ok(new ApiResponse<List<LeaderboardEntry>>
                {
                    Success = true,
                    Message = "Leaderboard retrieved successfully",
                    Data = leaderboard
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<List<LeaderboardEntry>>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }
    }

    public class UserAchievementResponse
    {
        public int Id { get; set; }
        public int AchievementId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public DateTime UnlockedAt { get; set; }
        public bool IsNew { get; set; }
    }
}

