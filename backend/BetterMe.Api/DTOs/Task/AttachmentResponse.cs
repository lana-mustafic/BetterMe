namespace BetterMe.Api.DTOs.Task
{
    public class AttachmentResponse
    {
        public int Id { get; set; }
        public string Filename { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string? Url { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}

