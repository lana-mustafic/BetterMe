using AutoMapper;
using ToDoApi.DTOs.Auth;
using ToDoApi.DTOs.Task;
using ToDoApi.Models;

namespace ToDoApi.Mapping
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // User -> UserResponse mapping
            CreateMap<User, UserResponse>()
                .ForMember(dest => dest.DisplayName, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.DateCreated, opt => opt.MapFrom(src => src.DateCreated));

            // RegisterRequest -> User mapping
            CreateMap<RegisterRequest, User>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.DisplayName))
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
                .ForMember(dest => dest.DateCreated, opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.LastLogin, opt => opt.MapFrom(_ => (DateTime?)null));

            // UpdateProfileRequest -> User mapping (for updates)
            CreateMap<UpdateProfileRequest, User>()
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.DisplayName))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
                .ForMember(dest => dest.DateCreated, opt => opt.Ignore())
                .ForMember(dest => dest.LastLogin, opt => opt.Ignore())
                .ForMember(dest => dest.TodoTasks, opt => opt.Ignore())
                .ForMember(dest => dest.Tags, opt => opt.Ignore());

            // TodoTask -> TaskResponse mapping (REMOVED OwnerId mapping)
            CreateMap<TodoTask, TaskResponse>()
                // REMOVED: .ForMember(dest => dest.OwnerId, opt => opt.MapFrom(src => src.UserId))
                .ForMember(dest => dest.CompletedAt, opt => opt.MapFrom(
                    src => src.Completed ? src.CompletedAt : null))
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category))
                .ForMember(dest => dest.Tags, opt => opt.MapFrom(src =>
                    src.TaskTags.Select(tt => tt.Tag.Name).ToList()))
                // Recurrence fields
                .ForMember(dest => dest.IsRecurring, opt => opt.MapFrom(src => src.IsRecurring))
                .ForMember(dest => dest.RecurrencePattern, opt => opt.MapFrom(src => src.RecurrencePattern))
                .ForMember(dest => dest.RecurrenceInterval, opt => opt.MapFrom(src => src.RecurrenceInterval))
                .ForMember(dest => dest.RecurrenceEndDate, opt => opt.MapFrom(src => src.RecurrenceEndDate))
                .ForMember(dest => dest.NextDueDate, opt => opt.MapFrom(src => src.NextDueDate))
                .ForMember(dest => dest.CompletedInstances, opt => opt.MapFrom(src => src.CompletedInstances))
                .ForMember(dest => dest.OriginalTaskId, opt => opt.MapFrom(src => src.OriginalTaskId));

            // CreateTaskRequest -> TodoTask mapping
            CreateMap<CreateTaskRequest, TodoTask>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.Completed, opt => opt.MapFrom(_ => false))
                .ForMember(dest => dest.CompletedAt, opt => opt.MapFrom(_ => (DateTime?)null))
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category))
                .ForMember(dest => dest.TaskTags, opt => opt.Ignore())
                // Recurrence fields
                .ForMember(dest => dest.IsRecurring, opt => opt.MapFrom(src => src.IsRecurring))
                .ForMember(dest => dest.RecurrencePattern, opt => opt.MapFrom(src => src.RecurrencePattern))
                .ForMember(dest => dest.RecurrenceInterval, opt => opt.MapFrom(src => src.RecurrenceInterval))
                .ForMember(dest => dest.RecurrenceEndDate, opt => opt.MapFrom(src => src.RecurrenceEndDate))
                .ForMember(dest => dest.NextDueDate, opt => opt.MapFrom(src => src.DueDate))
                .ForMember(dest => dest.CompletedInstances, opt => opt.MapFrom(_ => new List<string>()))
                .ForMember(dest => dest.OriginalTaskId, opt => opt.Ignore());

            // UpdateTaskRequest -> TodoTask mapping
            CreateMap<UpdateTaskRequest, TodoTask>()
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.TaskTags, opt => opt.Ignore())
                .ForMember(dest => dest.CompletedAt, opt => opt.Ignore())
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) =>
                    srcMember != null));

            // Tag -> TagResponse mapping
            CreateMap<Tag, TagResponse>()
                .ForMember(dest => dest.TaskCount, opt => opt.MapFrom(src => src.TaskTags.Count));
        }
    }
}