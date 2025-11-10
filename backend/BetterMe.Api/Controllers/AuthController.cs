using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using BetterMe.Api.DTOs.Auth;
using BetterMe.Api.Services.Interfaces;
using System.Threading.Tasks;
using AuthDTOs = BetterMe.Api.DTOs.Auth;
using Microsoft.AspNetCore.Cors;
using Microsoft.Extensions.Logging;

namespace BetterMe.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableCors] // Add this to use your CORS policy
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly IMapper _mapper;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            IUserService userService,
            ITokenService tokenService,
            IMapper mapper,
            IEmailService emailService,
            ILogger<AuthController> logger)
        {
            _userService = userService;
            _tokenService = tokenService;
            _mapper = mapper;
            _emailService = emailService;
            _logger = logger;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthDTOs.RegisterRequest req)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { message = "Invalid request data.", errors = ModelState });

                var user = await _userService.RegisterAsync(req);

                var emailSent = false;
                try
                {
                    emailSent = await _emailService.SendVerificationEmailAsync(
                        user.Email,
                        user.EmailVerificationToken!,
                        user.Name
                    );
                }
                catch (Exception emailEx)
                {
                    _logger.LogError(emailEx, "Failed to send verification email to {Email}", user.Email);
                }

                var responseMessage = emailSent
                    ? "Registration successful! Please check your email for verification instructions."
                    : "Registration successful! Please contact support for email verification.";

                return Ok(new { message = responseMessage });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Registration rejected for {Email}", req.Email);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred during registration for {Email}", req.Email);
                return StatusCode(500, new { message = "An error occurred during registration." });
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

                if (!user.IsEmailVerified)
                    return Unauthorized(new
                    {
                        message = "Please verify your email before logging in.",
                        requiresVerification = true
                    });

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
                // Log the exception here
                return StatusCode(500, new { message = "An error occurred during login." });
            }
        }

        // GET: api/auth/verify
        [HttpGet("verify")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string email, [FromQuery] string token)
        {
            try
            {
                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(token))
                    return BadRequest(new { message = "Invalid verification link." });

                var result = await _userService.VerifyEmailAsync(email, token);

                if (!result)
                    return BadRequest(new { message = "Verification link is invalid or expired." });

                // Get user for welcome email
                var user = await _userService.GetUserByEmailAsync(email);
                if (user != null)
                {
                    await _emailService.SendWelcomeEmailAsync(user.Email, user.Name);
                }

                return Ok(new { message = "🎉 Email verified successfully! You can now log in." });
            }
            catch (Exception ex)
            {
                // Log the exception here
                return StatusCode(500, new { message = "An error occurred during email verification." });
            }
        }

        // GET: api/auth/check-verification
        [HttpGet("check-verification")]
        public async Task<IActionResult> CheckEmailVerification([FromQuery] string email)
        {
            try
            {
                if (string.IsNullOrEmpty(email))
                    return BadRequest(new { message = "Email is required." });

                var user = await _userService.GetUserByEmailAsync(email);
                if (user == null)
                    return NotFound(new { message = "User not found." });

                return Ok(new
                {
                    isVerified = user.IsEmailVerified,
                    email = user.Email
                });
            }
            catch (Exception ex)
            {
                // Log the exception here
                return StatusCode(500, new { message = "Error checking verification status." });
            }
        }

        // POST: api/auth/resend-verification
        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerificationEmail([FromBody] AuthDTOs.ResendVerificationRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { message = "Invalid request data.", errors = ModelState });

                var user = await _userService.GetUserByEmailAsync(request.Email);
                if (user == null)
                    return NotFound(new { message = "User not found." });

                if (user.IsEmailVerified)
                    return BadRequest(new { message = "Email is already verified." });

                // Generate new verification token
                var newToken = await _userService.GenerateNewVerificationTokenAsync(user.Email);

                var emailSent = await _emailService.SendVerificationEmailAsync(
                    user.Email,
                    newToken,
                    user.Name
                );

                var responseMessage = emailSent
                    ? "Verification email sent successfully!"
                    : "Failed to send verification email. Please try again later.";

                return Ok(new { message = responseMessage });
            }
            catch (Exception ex)
            {
                // Log the exception here
                return StatusCode(500, new { message = "An error occurred while resending verification email." });
            }
        }


        [HttpOptions("register")]
        [HttpOptions("login")]
        [HttpOptions("verify")]
        [HttpOptions("check-verification")]
        [HttpOptions("resend-verification")]
        public IActionResult Options()
        {

            return Ok();
        }
    }
}