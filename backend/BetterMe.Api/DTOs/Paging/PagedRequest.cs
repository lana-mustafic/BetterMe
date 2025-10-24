namespace BetterMe.Api.DTOs.Paging
{
    public class PagedRequest
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public string? SortBy { get; set; }
        public string? SortDir { get; set; }
        public string? Filter { get; set; }
    }
}
