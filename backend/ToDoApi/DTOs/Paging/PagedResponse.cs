namespace ToDoApi.DTOs.Paging
{
    public class PagedResponse<T>
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalRecords { get; set; }   
        public IEnumerable<T> Data { get; set; }
    }
}
