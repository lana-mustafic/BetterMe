namespace BetterMe.Api.DTOs.Collaboration
{
    public class AssignTaskRequest
    {
        public int? AssignedToUserId { get; set; } // null to unassign
    }
}

