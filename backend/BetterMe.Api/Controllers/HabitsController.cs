using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BetterMe.Models;
using BetterMe.Api.Services.Interfaces;
using System.Security.Claims;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class HabitsController : ControllerBase
    {
        private readonly IHabitService _habitService;

        public HabitsController(IHabitService habitService)
        {
            _habitService = habitService;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("Invalid user ID");
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<Habit>>>> GetHabits()
        {
            try
            {
                var userId = GetUserId();
                var habits = await _habitService.GetUserHabitsAsync(userId);
                return Ok(new ApiResponse<List<Habit>>
                {
                    Success = true,
                    Data = habits
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<List<Habit>>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<Habit>>> GetHabit(Guid id)
        {
            try
            {
                var userId = GetUserId();
                var habit = await _habitService.GetHabitByIdAsync(id, userId);

                if (habit == null)
                    return NotFound(new ApiResponse<Habit>
                    {
                        Success = false,
                        Message = "Habit not found"
                    });

                return Ok(new ApiResponse<Habit>
                {
                    Success = true,
                    Data = habit
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<Habit>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<Habit>>> CreateHabit(CreateHabitRequest request)
        {
            try
            {
                var userId = GetUserId();
                var habit = await _habitService.CreateHabitAsync(request, userId);

                return CreatedAtAction(nameof(GetHabit), new { id = habit.Id },
                    new ApiResponse<Habit>
                    {
                        Success = true,
                        Message = "Habit created successfully",
                        Data = habit
                    });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<Habit>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<Habit>>> UpdateHabit(Guid id, UpdateHabitRequest request)
        {
            try
            {
                var userId = GetUserId();
                var habit = await _habitService.UpdateHabitAsync(id, request, userId);

                if (habit == null)
                    return NotFound(new ApiResponse<Habit>
                    {
                        Success = false,
                        Message = "Habit not found"
                    });

                return Ok(new ApiResponse<Habit>
                {
                    Success = true,
                    Message = "Habit updated successfully",
                    Data = habit
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<Habit>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteHabit(Guid id)
        {
            try
            {
                var userId = GetUserId();
                var result = await _habitService.DeleteHabitAsync(id, userId);

                if (!result)
                    return NotFound(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Habit not found"
                    });

                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Habit deleted successfully"
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

        [HttpPost("{id}/complete")]
        public async Task<ActionResult<ApiResponse<HabitCompletion>>> CompleteHabit(Guid id, CompleteHabitRequest request)
        {
            try
            {
                var userId = GetUserId();
                var completion = await _habitService.CompleteHabitAsync(id, request, userId);

                return Ok(new ApiResponse<HabitCompletion>
                {
                    Success = true,
                    Message = "Habit completed successfully",
                    Data = completion
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<HabitCompletion>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        [HttpDelete("{id}/completions/{date}")]
        public async Task<ActionResult<ApiResponse<bool>>> UncompleteHabit(Guid id, DateTime date)
        {
            try
            {
                var userId = GetUserId();
                var result = await _habitService.UncompleteHabitAsync(id, date, userId);

                if (!result)
                    return NotFound(new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Completion not found"
                    });

                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Completion removed successfully"
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

        [HttpGet("{id}/completions")]
        public async Task<ActionResult<ApiResponse<List<HabitCompletion>>>> GetCompletions(
            Guid id, [FromQuery] DateTime start, [FromQuery] DateTime end)
        {
            try
            {
                var userId = GetUserId();
                var completions = await _habitService.GetHabitCompletionsAsync(id, start, end, userId);

                return Ok(new ApiResponse<List<HabitCompletion>>
                {
                    Success = true,
                    Data = completions
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<List<HabitCompletion>>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        [HttpGet("stats")]
        public async Task<ActionResult<ApiResponse<HabitStatsResponse>>> GetStats()
        {
            try
            {
                var userId = GetUserId();
                var stats = await _habitService.GetHabitStatsAsync(userId);

                return Ok(new ApiResponse<HabitStatsResponse>
                {
                    Success = true,
                    Data = stats
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<HabitStatsResponse>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }

        [HttpGet("level-system")]
        public async Task<ActionResult<ApiResponse<LevelSystemResponse>>> GetLevelSystem()
        {
            try
            {
                var userId = GetUserId();
                var levelSystem = await _habitService.GetLevelSystemAsync(userId);

                return Ok(new ApiResponse<LevelSystemResponse>
                {
                    Success = true,
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

        [HttpGet("today")]
        public async Task<ActionResult<ApiResponse<List<Habit>>>> GetTodayHabits()
        {
            try
            {
                var userId = GetUserId();
                var habits = await _habitService.GetTodayHabitsAsync(userId);

                return Ok(new ApiResponse<List<Habit>>
                {
                    Success = true,
                    Data = habits
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new ApiResponse<List<Habit>>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }
    }
}