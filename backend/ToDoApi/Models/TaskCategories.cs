namespace ToDoApi.Models
{
    public static class TaskCategories
    {
        public const string Work = "Work";
        public const string Personal = "Personal";
        public const string Shopping = "Shopping";
        public const string Health = "Health";
        public const string Education = "Education";
        public const string Finance = "Finance";
        public const string Home = "Home";
        public const string Other = "Other";

        public static readonly string[] All =
        {
            Work, Personal, Shopping, Health, Education, Finance, Home, Other
        };

        public static bool IsValidCategory(string category)
        {
            return All.Contains(category);
        }
    }
}