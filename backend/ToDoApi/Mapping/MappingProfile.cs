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

            // TodoTask -> TaskResponse mapping (UPDATED)
            CreateMap<TodoTask, TaskResponse>()
                .ForMember(dest => dest.OwnerId, opt => opt.MapFrom(src => src.UserId))
                .ForMember(dest => dest.CompletedAt, opt => opt.MapFrom(
                    src => src.Completed ? src.UpdatedAt : null))
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category))
                .ForMember(dest => dest.Tags, opt => opt.MapFrom(src =>
                    src.TaskTags.Select(tt => tt.Tag.Name).ToList()));

            // CreateTaskRequest -> TodoTask mapping (UPDATED)
            CreateMap<CreateTaskRequest, TodoTask>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.Completed, opt => opt.MapFrom(_ => false))
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category))
                .ForMember(dest => dest.TaskTags, opt => opt.Ignore()); // Tags handled in service

            // UpdateTaskRequest -> TodoTask mapping (UPDATED)
            CreateMap<UpdateTaskRequest, TodoTask>()
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(_ => DateTime.UtcNow))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.TaskTags, opt => opt.Ignore()) // Tags handled in service
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) =>
                    srcMember != null)); // Only update non-null properties

            // NEW: Tag -> TagResponse mapping
            CreateMap<Tag, TagResponse>()
                .ForMember(dest => dest.TaskCount, opt => opt.MapFrom(src => src.TaskTags.Count));
        }
    }
}