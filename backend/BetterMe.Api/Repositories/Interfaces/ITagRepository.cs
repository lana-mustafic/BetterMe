using BetterMe.Api.Models;

namespace BetterMe.Api.Repositories.Interfaces
{
    public interface ITagRepository
    {
        Task<Tag> GetByNameAsync(string name, int userId);
        Task<List<Tag>> GetAllByUserAsync(int userId);
        Task AddAsync(Tag tag);
        Task SaveChangesAsync();
    }
}