﻿using System.ComponentModel.DataAnnotations;

namespace BetterMe.Api.DTOs.Auth
{
    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
    }
}
