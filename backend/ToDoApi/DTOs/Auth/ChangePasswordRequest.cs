﻿using System.ComponentModel.DataAnnotations;

namespace ToDoApi.DTOs.Auth
{
    public class ChangePasswordRequest
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }
}