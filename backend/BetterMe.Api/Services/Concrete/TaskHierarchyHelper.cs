using BetterMe.Api.Data;
using BetterMe.Api.DTOs.Task;
using BetterMe.Api.Models;
using Microsoft.EntityFrameworkCore;
using AutoMapper;

namespace BetterMe.Api.Services.Concrete
{
    public static class TaskHierarchyHelper
    {
        public static async Task<TaskResponse> BuildTaskResponseAsync(TodoTask task, AppDbContext context, int? currentUserId = null, IMapper? mapper = null)
        {
            var response = new TaskResponse
            {
                Id = task.Id,
                OwnerId = task.UserId,
                Title = task.Title,
                Description = task.Description,
                DueDate = task.DueDate,
                Priority = task.Priority,
                Completed = task.Completed,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                CompletedAt = task.Completed ? task.CompletedAt : null,
                Category = task.Category,
                Tags = task.TaskTags?.Select(tt => tt.Tag?.Name).Where(name => name != null).ToList() ?? new List<string>(),
                IsRecurring = task.IsRecurring,
                RecurrencePattern = task.RecurrencePattern,
                RecurrenceInterval = task.RecurrenceInterval,
                RecurrenceEndDate = task.RecurrenceEndDate,
                CompletedInstances = task.CompletedInstances,
                NextDueDate = task.NextDueDate,
                OriginalTaskId = task.OriginalTaskId,
                ParentTaskId = task.ParentTaskId,
                ParentTaskTitle = task.ParentTask?.Title,
                AssignedToUserId = task.AssignedToUserId,
                AssignedToUserName = task.AssignedToUser?.Name,
                IsShared = currentUserId.HasValue && task.UserId != currentUserId.Value
            };

            // Load subtasks
            var subtasks = await context.TodoTasks
                .Include(t => t.TaskTags)
                    .ThenInclude(tt => tt.Tag)
                .Where(t => t.ParentTaskId == task.Id)
                .ToListAsync();

            response.SubtaskCount = subtasks.Count;
            response.CompletedSubtaskCount = subtasks.Count(t => t.Completed);

            // Build subtask responses recursively
            foreach (var subtask in subtasks)
            {
                var subtaskResponse = await BuildTaskResponseAsync(subtask, context, currentUserId, mapper);
                response.Subtasks.Add(subtaskResponse);
            }

            // Load dependencies
            var dependencies = await context.TaskDependencies
                .Include(td => td.DependsOnTask)
                .Where(td => td.TaskId == task.Id)
                .ToListAsync();

            response.DependsOnTaskIds = dependencies.Select(td => td.DependsOnTaskId).ToList();
            response.Dependencies = dependencies.Select(td => new DependencyInfo
            {
                TaskId = td.DependsOnTaskId,
                TaskTitle = td.DependsOnTask.Title,
                IsCompleted = td.DependsOnTask.Completed,
                DependencyType = td.DependencyType
            }).ToList();

            // Check if task can be completed
            var incompleteDependencies = dependencies.Where(td => !td.DependsOnTask.Completed).ToList();
            response.CanBeCompleted = !incompleteDependencies.Any();
            response.BlockingReasons = incompleteDependencies
                .Select(td => $"'{td.DependsOnTask.Title}' must be completed first")
                .ToList();

            // Map attachments
            if (task.Attachments != null && task.Attachments.Any())
            {
                if (mapper != null)
                {
                    response.Attachments = mapper.Map<List<AttachmentResponse>>(task.Attachments);
                }
                else
                {
                    // Manual mapping if AutoMapper is not available
                    response.Attachments = task.Attachments.Select(a => new AttachmentResponse
                    {
                        Id = a.Id,
                        Filename = a.Filename,
                        ContentType = a.ContentType,
                        FileSize = a.FileSize,
                        Url = a.Url ?? $"/api/tasks/{a.TodoTaskId}/attachments/{a.Id}",
                        UploadedAt = a.UploadedAt
                    }).ToList();
                }
            }

            return response;
        }

        public static List<TaskResponse> BuildTaskHierarchy(List<TodoTask> tasks, List<TaskResponse> responses)
        {
            // Build a dictionary for quick lookup
            var taskDict = responses.ToDictionary(r => r.Id);

            // Organize tasks into hierarchy
            var rootTasks = responses.Where(r => !r.ParentTaskId.HasValue).ToList();
            var subtaskDict = responses
                .Where(r => r.ParentTaskId.HasValue)
                .GroupBy(r => r.ParentTaskId.Value)
                .ToDictionary(g => g.Key, g => g.ToList());

            // Attach subtasks to their parents
            foreach (var rootTask in rootTasks)
            {
                AttachSubtasks(rootTask, subtaskDict);
            }

            return rootTasks;
        }

        private static void AttachSubtasks(TaskResponse parent, Dictionary<int, List<TaskResponse>> subtaskDict)
        {
            if (subtaskDict.ContainsKey(parent.Id))
            {
                parent.Subtasks = subtaskDict[parent.Id];
                foreach (var subtask in parent.Subtasks)
                {
                    AttachSubtasks(subtask, subtaskDict);
                }
            }
        }
    }
}

