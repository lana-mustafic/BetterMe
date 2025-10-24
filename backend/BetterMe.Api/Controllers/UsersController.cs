using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using BetterMe.Api.DTOs.Auth;
using BetterMe.Api.Services.Interfaces;
using System.Threading.Tasks;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IMapper _mapper;

        public UsersController(IUserService userService, IMapper mapper)
        {
            _userService = userService;
            _mapper = mapper;
        }

        // GET: api/users/me
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            // Use Microsoft claim types instead of JWT standard ones
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            var user = await _userService.GetByIdAsync(userId);
            if (user == null) return NotFound();

            var dto = _mapper.Map<UserResponse>(user);
            return Ok(dto);
        }

        // GET: api/users/{id}
        [Authorize]
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null) return NotFound();
            return Ok(_mapper.Map<UserResponse>(user));
        }

        // PUT: api/users/profile
        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            try
            {
                var updatedUser = await _userService.UpdateUserProfileAsync(userId, request);
                var userDto = _mapper.Map<UserResponse>(updatedUser);
                return Ok(userDto);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating profile." });
            }
        }

        // PUT: api/users/change-password
        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            try
            {
                var result = await _userService.ChangePasswordAsync(userId, request);
                if (result)
                {
                    return Ok(new { message = "Password changed successfully." });
                }
                else
                {
                    return BadRequest(new { message = "Current password is incorrect." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while changing password." });
            }
        }

        // DEBUG: api/users/debug-claims
        [Authorize]
        [HttpGet("debug-claims")]
        public IActionResult DebugClaims()
        {
            var claims = User.Claims.Select(c => new { Type = c.Type, Value = c.Value }).ToList();
            return Ok(new
            {
                IsAuthenticated = User.Identity?.IsAuthenticated,
                IdentityName = User.Identity?.Name,
                NameIdentifierClaim = User.FindFirstValue(ClaimTypes.NameIdentifier),
                EmailClaim = User.FindFirstValue(ClaimTypes.Email),
                GivenNameClaim = User.FindFirstValue(ClaimTypes.GivenName),
                AllClaims = claims
            });
        }

        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }
    }
}