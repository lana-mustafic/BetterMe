using ToDoApi.Models;

namespace ToDoApi.Services.Interfaces
{
    public interface ITokenService
    {
        string CreateToken(User user);
    }
}