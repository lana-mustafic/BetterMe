using ToDoApi.Models;

namespace ToDoApi.Repositories.Interfaces
{
    public interface IUserRepository
    {
        Task<User> GetByIdAsync(int id);
        Task<User> GetByEmailAsync(string email);   
        Task AddAsync(User user);
        Task SaveChangesAsync();
    }
}
