using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using BetterMe.Api.DTOs.Auth;
using BetterMe.Api.Services.Interfaces;
using System.Threading.Tasks;
using AuthDTOs = BetterMe.Api.DTOs.Auth;
using Microsoft.AspNetCore.Cors;
using Microsoft.Extensions.Logging;
using System.Text.RegularExpressions;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableCors]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ITokenService _tokenService;
        private readonly IMapper _mapper;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IUserService userService,
            ITokenService tokenService,
            IMapper mapper,
            ILogger<AuthController> logger)
        {
            _userService = userService;
            _tokenService = tokenService;
            _mapper = mapper;
            _logger = logger;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthDTOs.RegisterRequest req)
        {
            try
            {
                _logger.LogInformation("🔐 Registration attempt for: {Email}", req.Email);

                if (!ModelState.IsValid)
                    return BadRequest(new { message = "Invalid request data.", errors = ModelState });

                // Additional server-side password validation
                var passwordValidation = ValidatePassword(req.Password);
                if (!passwordValidation.IsValid)
                {
                    return BadRequest(new { message = passwordValidation.ErrorMessage });
                }

                // Register user
                var user = await _userService.RegisterAsync(req);
                _logger.LogInformation("✅ User registered successfully: {Email}", user.Email);

                return Ok(new { message = "Registration successful! You can now log in." });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "❌ Registration rejected for {Email}", req.Email);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "💥 Registration failed completely for {Email}", req.Email);
                return StatusCode(500, new { message = "Registration failed. Please try again." });
            }
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthDTOs.LoginRequest req)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { message = "Invalid request data.", errors = ModelState });

                var user = await _userService.LoginAsync(req);
                if (user == null)
                    return Unauthorized(new { message = "Invalid email or password." });

                var token = _tokenService.CreateToken(user);
                var userDto = _mapper.Map<UserResponse>(user);

                return Ok(new AuthResponse
                {
                    AccessToken = token,
                    User = userDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Login failed for {Email}", req.Email);
                return StatusCode(500, new { message = "An error occurred during login." });
            }
        }

        [HttpOptions("register")]
        [HttpOptions("login")]
        public IActionResult Options()
        {
            return Ok();
        }

        private (bool IsValid, string ErrorMessage) ValidatePassword(string password)
        {
            if (string.IsNullOrEmpty(password))
                return (false, "Password is required.");

            if (password.Length < 6)
                return (false, "Password must be at least 6 characters long.");

            if (!Regex.IsMatch(password, @"[a-zA-Z]"))
                return (false, "Password must contain at least one letter.");

            if (!Regex.IsMatch(password, @"[0-9]"))
                return (false, "Password must contain at least one number.");

            if (!Regex.IsMatch(password, @"[!@#$%^&*()_+\-=\[\]{};':""\\|,.<>\/?]"))
                return (false, "Password must contain at least one symbol.");

            return (true, string.Empty);
        }
    }
}