namespace ToDoApi.DTOs.Auth
{
    public class AuthResponse
    {
        public string AccessToken { get; set; }
        public UserResponse User { get; set; }
    }
}
