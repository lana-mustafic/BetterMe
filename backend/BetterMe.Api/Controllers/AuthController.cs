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
        private readonly IMapper _mapper;

        public AuthController(IUserService userService, ITokenService tokenService, IMapper mapper)
        {
            _userService = userService;
            _tokenService = tokenService;
            _mapper = mapper;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AuthDTOs.RegisterRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await _userService.RegisterAsync(req);

            var token = _tokenService.CreateToken(user);
            var userDto = _mapper.Map<UserResponse>(user);

       
            var authResp = new AuthResponse
            {
                AccessToken = token,
                User = userDto
            };

            // CRITICAL: This line must be present to see the JSON
            var json = System.Text.Json.JsonSerializer.Serialize(authResp, new System.Text.Json.JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
            });
            Console.WriteLine($"[JSON RESPONSE] Full response: {json}");
            Console.WriteLine("=== END DEBUGGING ===");

            return Ok(authResp);
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AuthDTOs.LoginRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var user = await _userService.LoginAsync(req);
            if (user == null) return Unauthorized(new { message = "Invalid credentials" });

            // DEBUGGING FOR LOGIN TOO
            Console.WriteLine("=== LOGIN DEBUGGING DATECREATED ===");
            Console.WriteLine($"[LOGIN] User DateCreated: {user.DateCreated}");
            Console.WriteLine($"[LOGIN] User DateCreated ToString(): {user.DateCreated.ToString()}");

            var token = _tokenService.CreateToken(user);
            var userDto = _mapper.Map<UserResponse>(user);

            Console.WriteLine($"[LOGIN] UserResponse DateCreated: {userDto.DateCreated}");
            Console.WriteLine("=== END LOGIN DEBUGGING ===");

            var authResp = new AuthResponse
            {
                AccessToken = token,
                User = userDto
            };

            return Ok(authResp);
        }

    }
}
