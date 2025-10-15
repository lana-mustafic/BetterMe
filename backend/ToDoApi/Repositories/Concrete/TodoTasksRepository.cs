using Microsoft.EntityFrameworkCore;
using ToDoApi.Data;
using ToDoApi.Models;
using ToDoApi.Repositories.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ToDoApi.Repositories.Concrete
{
    public class TodoTasksRepository : ITodoTasksRepository
    {
        private readonly AppDbContext _context;

        public TodoTasksRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TodoTask> GetByIdAsync(int id) =>
            await _context.TodoTasks.FindAsync(id);

        public async Task<TodoTask> GetByIdWithTagsAsync(int id) =>
            await _context.TodoTasks
                .Include(t => t.TaskTags)
                .ThenInclude(tt => tt.Tag)
                .FirstOrDefaultAsync(t => t.Id == id);

        public async Task<List<TodoTask>> GetAllByUserAsync(int userId) =>
            await _context.TodoTasks
                .Where(t => t.UserId == userId)
                .Include(t => t.TaskTags)
                .ThenInclude(tt => tt.Tag)
                .ToListAsync();

        public async Task AddAsync(TodoTask task) =>
            await _context.TodoTasks.AddAsync(task);

        public void Remove(TodoTask task) =>
            _context.TodoTasks.Remove(task);

        public async Task SaveChangesAsync() =>
            await _context.SaveChangesAsync();
    }
}