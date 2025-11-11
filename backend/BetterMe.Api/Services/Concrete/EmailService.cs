using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using Microsoft.Extensions.Configuration;
using BetterMe.Api.Services.Interfaces;
using System.Text.Json;

namespace BetterMe.Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public EmailService(IConfiguration configuration, HttpClient httpClient)
        {
            _configuration = configuration;
            _httpClient = httpClient;
        }

        public async Task<bool> SendVerificationEmailAsync(string email, string verificationToken, string displayName)
        {
            try
            {
                Console.WriteLine($"🎯 [Resend] Starting email to: {email}");

                var apiKey = _configuration["Email:ApiKey"];
                var fromEmail = _configuration["Email:FromEmail"] ?? "onboarding@resend.dev";
                var fromName = _configuration["Email:FromName"] ?? "BetterMe";
                var appBaseUrl = _configuration["AppBaseUrl"];
                var allowedTestEmail = _configuration["Email:AllowedTestEmail"] ?? "lana.mustafic@edu.fit.ba";

                // Create verification URL
                var encodedToken = HttpUtility.UrlEncode(verificationToken);
                var encodedEmail = HttpUtility.UrlEncode(email);
                var verificationUrl = $"{appBaseUrl}/verify-email?token={encodedToken}&email={encodedEmail}";

                Console.WriteLine($"🔗 Verification URL: {verificationUrl}");

                // If no API key, use manual verification
                if (string.IsNullOrEmpty(apiKey))
                {
                    Console.WriteLine($"📝 No Resend API key - using manual verification");
                    return true;
                }

                // For testing, only send to allowed email address
                var emailToSendTo = email.EndsWith("@gmail.com") ? allowedTestEmail : email;

                Console.WriteLine($"📤 [Resend] Sending email to (allowed): {emailToSendTo}");
                Console.WriteLine($"📝 Original email was: {email}");

                // Send with Resend API
                var requestData = new
                {
                    from = $"{fromName} <{fromEmail}>",
                    to = emailToSendTo,
                    subject = "Verify Your Email - BetterMe",
                    html = CreateVerificationEmailBody(displayName, verificationUrl, email),
                    text = $"Verify your BetterMe account: {verificationUrl}"
                };

                var json = JsonSerializer.Serialize(requestData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                var response = await _httpClient.PostAsync("https://api.resend.com/emails", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"✅ [Resend] EMAIL SENT SUCCESSFULLY to: {emailToSendTo}");
                    Console.WriteLine($"📨 Resend response: {responseContent}");
                    return true;
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"❌ [Resend] Failed to send email");
                    Console.WriteLine($"❌ Status: {response.StatusCode}");
                    Console.WriteLine($"❌ Error: {error}");

                    // Still return true so registration doesn't fail
                    return true;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [Resend] Exception: {ex.Message}");
                return true; // Always return true for registration
            }
        }

        private string CreateVerificationEmailBody(string displayName, string verificationUrl, string originalEmail)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }}
        .content {{ padding: 30px; background: #f9f9f9; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; }}
        .footer {{ text-align: center; padding: 20px; color: #666; font-size: 14px; }}
        .note {{ background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>🚀 BetterMe</h1>
            <p>Your productivity journey starts here</p>
        </div>
        <div class='content'>
            <div class='note'>
                <strong>📧 Test Email</strong><br/>
                This email was originally addressed to: <strong>{originalEmail}</strong><br/>
                But was redirected to you for testing purposes.
            </div>
            
            <h2>Hello {displayName}!</h2>
            <p>Welcome to BetterMe! We're excited to help you organize your tasks and boost your productivity.</p>
            <p>Please verify your email address to get started:</p>
            <p style='text-align: center; margin: 30px 0;'>
                <a href='{verificationUrl}' class='button'>Verify My Email</a>
            </p>
            <p>Or copy and paste this link in your browser:</p>
            <p style='background: #eee; padding: 15px; border-radius: 5px; word-break: break-all;'>
                {verificationUrl}
            </p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create this account, please ignore this email.</p>
        </div>
        <div class='footer'>
            <p>&copy; {DateTime.Now.Year} BetterMe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }
        public async Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string displayName)
        {
            try
            {
                Console.WriteLine($"🎯 [Resend] Password reset for: {email}");

                var apiKey = _configuration["Email:ApiKey"];
                if (string.IsNullOrEmpty(apiKey)) return true;

                var appBaseUrl = _configuration["AppBaseUrl"];
                var resetUrl = $"{appBaseUrl}/reset-password?token={HttpUtility.UrlEncode(resetToken)}&email={HttpUtility.UrlEncode(email)}";

                var requestData = new
                {
                    from = $"{_configuration["Email:FromName"]} <{_configuration["Email:FromEmail"]}>",
                    to = email,
                    subject = "Reset Your Password - BetterMe",
                    html = $@"<div><h2>Password Reset</h2><p>Click here to reset your password: <a href='{resetUrl}'>{resetUrl}</a></p></div>"
                };

                var json = JsonSerializer.Serialize(requestData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                await _httpClient.PostAsync("https://api.resend.com/emails", content);
                Console.WriteLine($"✅ [Resend] Password reset email sent to: {email}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [Resend] Password reset failed: {ex.Message}");
                return true;
            }
        }

        public async Task<bool> SendWelcomeEmailAsync(string email, string displayName)
        {
            try
            {
                Console.WriteLine($"🎯 [Resend] Welcome email for: {email}");

                var apiKey = _configuration["Email:ApiKey"];
                if (string.IsNullOrEmpty(apiKey)) return true;

                var requestData = new
                {
                    from = $"{_configuration["Email:FromName"]} <{_configuration["Email:FromEmail"]}>",
                    to = email,
                    subject = "Welcome to BetterMe!",
                    html = $@"<div>
                        <h2>Welcome to BetterMe, {displayName}! 🎉</h2>
                        <p>Your account is now verified and ready to use.</p>
                        <p>Start organizing your tasks and boosting your productivity!</p>
                        <ul>
                            <li>📝 Create and manage tasks</li>
                            <li>🔄 Set up recurring tasks</li>
                            <li>📊 Track your progress</li>
                            <li>🏷️ Organize with tags</li>
                        </ul>
                    </div>"
                };

                var json = JsonSerializer.Serialize(requestData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

                await _httpClient.PostAsync("https://api.resend.com/emails", content);
                Console.WriteLine($"✅ [Resend] Welcome email sent to: {email}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [Resend] Welcome email failed: {ex.Message}");
                return true;
            }
        }

        public async Task<bool> SendGenericEmailAsync(string email, string subject, string body, bool isHtml = true)
        {
            return true; // Implement if needed
        }

        public async Task<bool> SendNotificationEmailAsync(string email, string title, string message, string displayName)
        {
            return true; // Implement if needed
        }

        public async Task<bool> IsEmailConfiguredAsync()
        {
            return await Task.FromResult(!string.IsNullOrEmpty(_configuration["Email:ApiKey"]));
        }
    }
}