using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using System.Web;
using Microsoft.Extensions.Configuration;
using BetterMe.Api.Services.Interfaces;

namespace BetterMe.Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _smtpUsername;
        private readonly string _smtpPassword;
        private readonly string _fromEmail;
        private readonly string _fromName;
        private readonly string _appBaseUrl;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
            _smtpHost = _configuration["Email:SmtpHost"] ?? "smtp.gmail.com";
            _smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
            _smtpUsername = _configuration["Email:SmtpUsername"];
            _smtpPassword = _configuration["Email:SmtpPassword"];
            _fromEmail = _configuration["Email:FromEmail"] ?? _smtpUsername;
            _fromName = _configuration["Email:FromName"] ?? "BetterMe";
            _appBaseUrl = _configuration["AppBaseUrl"] ?? "https://betterme-frontend.onrender.com";
        }

        public async Task<bool> IsEmailConfiguredAsync()
        {
            return await Task.FromResult(!string.IsNullOrEmpty(_smtpUsername) &&
                                       !string.IsNullOrEmpty(_smtpPassword));
        }

        public async Task<bool> SendVerificationEmailAsync(string email, string verificationToken, string displayName)
        {
            try
            {
                Console.WriteLine($"🎯 [EmailService] SIMPLE VERSION - Registration token for {email}: {verificationToken}");
                Console.WriteLine($"🎯 [EmailService] User can verify at: /verify-email?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(verificationToken)}");

                // Try to send real email if configured
                if (await IsEmailConfiguredAsync())
                {
                    try
                    {
                        var encodedToken = HttpUtility.UrlEncode(verificationToken);
                        var encodedEmail = HttpUtility.UrlEncode(email);
                        var verificationUrl = $"{_appBaseUrl}/verify-email?token={encodedToken}&email={encodedEmail}";

                        Console.WriteLine($"[EmailService] Attempting real email send to: {email}");
                        var subject = "Verify Your Email - BetterMe";
                        var body = CreateVerificationEmailBody(displayName, verificationUrl);

                        var realEmailSent = await SendEmailAsync(email, subject, body);
                        if (realEmailSent)
                        {
                            Console.WriteLine($"[EmailService] ✅ Real email sent successfully to: {email}");
                            return true;
                        }
                    }
                    catch (Exception realEmailEx)
                    {
                        Console.WriteLine($"[EmailService] ❌ Real email failed, but registration will continue: {realEmailEx.Message}");
                    }
                }

                // ALWAYS return true - registration should never fail due to email
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [EmailService] Even simple version failed: {ex.Message}");
                return true; // STILL return true to not block registration
            }
        }

        public async Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string displayName)
        {
            try
            {
                Console.WriteLine($"🎯 [EmailService] Password reset token for {email}: {resetToken}");

                if (await IsEmailConfiguredAsync())
                {
                    try
                    {
                        var encodedToken = HttpUtility.UrlEncode(resetToken);
                        var encodedEmail = HttpUtility.UrlEncode(email);
                        var resetUrl = $"{_appBaseUrl}/reset-password?token={encodedToken}&email={encodedEmail}";

                        var subject = "Reset Your Password - BetterMe";
                        var body = CreatePasswordResetEmailBody(displayName, resetUrl);

                        return await SendEmailAsync(email, subject, body);
                    }
                    catch (Exception)
                    {
                        // If real email fails, still return true
                        return true;
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send password reset email: {ex.Message}");
                return true; // Always return true
            }
        }

        public async Task<bool> SendWelcomeEmailAsync(string email, string displayName)
        {
            try
            {
                Console.WriteLine($"🎯 [EmailService] Welcome email would be sent to: {email}");

                if (await IsEmailConfiguredAsync())
                {
                    try
                    {
                        var subject = "Welcome to BetterMe!";
                        var body = CreateWelcomeEmailBody(displayName);

                        return await SendEmailAsync(email, subject, body);
                    }
                    catch (Exception)
                    {
                        return true;
                    }
                }

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send welcome email: {ex.Message}");
                return true; // Always return true
            }
        }

        public async Task<bool> SendGenericEmailAsync(string email, string subject, string body, bool isHtml = true)
        {
            try
            {
                if (await IsEmailConfiguredAsync())
                {
                    try
                    {
                        return await SendEmailAsync(email, subject, body, isHtml);
                    }
                    catch (Exception)
                    {
                        return true;
                    }
                }

                Console.WriteLine($"[EmailService] SMTP not configured. Would send generic email to: {email}");
                Console.WriteLine($"[EmailService] Subject: {subject}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send generic email: {ex.Message}");
                return true;
            }
        }

        public async Task<bool> SendNotificationEmailAsync(string email, string title, string message, string displayName)
        {
            try
            {
                if (await IsEmailConfiguredAsync())
                {
                    try
                    {
                        var subject = $"{title} - BetterMe";
                        var body = CreateNotificationEmailBody(displayName, title, message);

                        return await SendEmailAsync(email, subject, body);
                    }
                    catch (Exception)
                    {
                        return true;
                    }
                }

                Console.WriteLine($"[EmailService] SMTP not configured. Would send notification email to: {email}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send notification email: {ex.Message}");
                return true;
            }
        }

        private string CreateVerificationEmailBody(string displayName, string verificationUrl)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>BetterMe</h1>
        </div>
        <div class='content'>
            <h2>Hello {displayName}!</h2>
            <p>Welcome to BetterMe! Please verify your email address by clicking the button below:</p>
            <p style='text-align: center;'>
                <a href='{verificationUrl}' class='button'>Verify Email</a>
            </p>
            <p>Or copy this link to your browser:</p>
            <p style='word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;'>{verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with BetterMe, please ignore this email.</p>
        </div>
        <div class='footer'>
            <p>&copy; {DateTime.Now.Year} BetterMe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string CreatePasswordResetEmailBody(string displayName, string resetUrl)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Password Reset</h1>
        </div>
        <div class='content'>
            <h2>Hello {displayName}!</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style='text-align: center;'>
                <a href='{resetUrl}' class='button'>Reset Password</a>
            </p>
            <p>Or copy this link to your browser:</p>
            <p style='word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;'>{resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div class='footer'>
            <p>&copy; {DateTime.Now.Year} BetterMe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string CreateWelcomeEmailBody(string displayName)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }}
        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to BetterMe!</h1>
        </div>
        <div class='content'>
            <h2>Hello {displayName}!</h2>
            <p>Your account has been successfully verified!</p>
            <p>Start organizing your tasks and boosting your productivity with our features:</p>
            <ul>
                <li>📝 Smart task management</li>
                <li>🔄 Recurring tasks</li>
                <li>📊 Progress tracking</li>
                <li>🏷️ Tag organization</li>
            </ul>
            <p>We're excited to help you achieve your goals!</p>
        </div>
        <div class='footer'>
            <p>&copy; {DateTime.Now.Year} BetterMe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string CreateNotificationEmailBody(string displayName, string title, string message)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }}
        .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>BetterMe Notification</h1>
        </div>
        <div class='content'>
            <h2>Hello {displayName}!</h2>
            <h3>{title}</h3>
            <p>{message}</p>
        </div>
        <div class='footer'>
            <p>&copy; {DateTime.Now.Year} BetterMe. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }

        private async Task<bool> SendEmailAsync(string toEmail, string subject, string body, bool isHtml = true)
        {
            try
            {
                using var client = new SmtpClient(_smtpHost, _smtpPort)
                {
                    Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                    EnableSsl = true,
                    Timeout = 10000
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, _fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = isHtml
                };
                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);

                Console.WriteLine($"[EmailService] ✅ Email sent successfully to: {toEmail}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] ❌ Failed to send email to {toEmail}: {ex.Message}");
                return false;
            }
        }
    }
}