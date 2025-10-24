using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BetterMe.Api.Models;
using BetterMe.Api.Services.Interfaces;

namespace BetterMe.Api.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _cfg;
        private readonly SymmetricSecurityKey _signingKey;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly int _expiryMinutes;

        public TokenService(IConfiguration cfg)
        {
            _cfg = cfg;
            var key = Environment.GetEnvironmentVariable("JWT_KEY") ?? cfg["Jwt:Key"];
            _signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            _issuer = cfg["Jwt:Issuer"] ?? "BetterMe.Api";
            _audience = cfg["Jwt:Audience"] ?? "BetterMe.ApiClient";

            // Increase expiry time - 7 days instead of default 60 minutes
            _expiryMinutes = int.TryParse(cfg["Jwt:ExpiryMinutes"], out var m) ? m : 10080; // 7 days
        }

        public string CreateToken(User user)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.GivenName, user.Name), // Changed from "displayName" to standard GivenName
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) // Add unique token ID
            };

            var creds = new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(_expiryMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}