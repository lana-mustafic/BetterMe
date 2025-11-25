namespace BetterMe.Api.DTOs.Collaboration
{
    public class SharedTaskResponse
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int OwnerId { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public string OwnerEmail { get; set; } = string.Empty;
        public int SharedWithUserId { get; set; }
        public string SharedWithUserName { get; set; } = string.Empty;
        public string SharedWithUserEmail { get; set; } = string.Empty;
        public SharePermissionDto Permission { get; set; }
        public DateTime SharedAt { get; set; }
        public DateTime? LastAccessedAt { get; set; }
        public string? ShareToken { get; set; }
        public bool IsPublic { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }
}

