using BetterMe.Api.Models;

namespace BetterMe.Api.Services.Interfaces
{
    public interface ITokenService
    {
        string CreateToken(User user);
    }
}