namespace BetterMe.Api.DTOs.Collaboration
{
    public class CommentResponse
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public bool IsEdited { get; set; }
        public int? ParentCommentId { get; set; }
        public List<CommentResponse> Replies { get; set; } = new List<CommentResponse>();
    }
}

