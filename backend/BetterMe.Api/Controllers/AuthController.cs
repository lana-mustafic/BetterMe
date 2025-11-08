using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using BetterMe.Api.DTOs.Auth;
using BetterMe.Api.Services.Interfaces;
using System.Threading.Tasks;
using AuthDTOs = BetterMe.Api.DTOs.Auth;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly IMapper _mapper;

        public AuthController(
            IUserService userService,
            ITokenService tokenService,
            IMapper mapper,
            IEmailService emailService)
        {
            _userService = userService;
            _tokenService = tokenService;
            _mapper = mapper;
            _emailService = emailService;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthDTOs.RegisterRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await _userService.RegisterAsync(req);

            // Send email verification
            await _emailService.SendVerificationEmailAsync(
                user.Email,
                user.EmailVerificationToken!,
                user.Name
            );

            return Ok(new
            {
                message = "✅ Registration successful! Please verify your email before logging in."
            });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthDTOs.LoginRequest req)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userService.LoginAsync(req);
            if (user == null)
                return Unauthorized(new { message = "Invalid credentials" });

            if (!user.IsEmailVerified)
                return Unauthorized(new { message = "Please verify your email before logging in." });

            var token = _tokenService.CreateToken(user);
            var userDto = _mapper.Map<UserResponse>(user);

            return Ok(new AuthResponse
            {
                AccessToken = token,
                User = userDto
            });
        }

        
        // GET: api/auth/verify
        [HttpGet("verify")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string email, [FromQuery] string token)
        {
            if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(token))
                return BadRequest(new { message = "Invalid verification link." });

            var result = await _userService.VerifyEmailAsync(email, token);

            if (!result)
                return BadRequest(new { message = "Verification link is invalid or expired." });

            await _emailService.SendWelcomeEmailAsync(email, "");

            return Ok(new { message = "🎉 Email verified successfully! You can now log in." });
        }
    }
}
