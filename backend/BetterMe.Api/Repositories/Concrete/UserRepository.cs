using Microsoft.EntityFrameworkCore;
using BetterMe.Api.Data;
using BetterMe.Api.Models;
using BetterMe.Api.Repositories.Interfaces;

public class UsersRepository : IUserRepository
{
    private readonly AppDbContext _context;
    public UsersRepository(AppDbContext context) => _context = context;

    public async Task<User> GetByIdAsync(int id) => await _context.Users.FindAsync(id);
    public async Task<User> GetByEmailAsync(string email) =>
        await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    public async Task AddAsync(User user) => await _context.Users.AddAsync(user);
    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}
