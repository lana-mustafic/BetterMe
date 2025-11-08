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

        public async Task<bool> SendVerificationEmailAsync(string email, string verificationToken, string displayName)
        {
            try
            {
                var encodedToken = HttpUtility.UrlEncode(verificationToken);
                var encodedEmail = HttpUtility.UrlEncode(email);
                var verificationUrl = $"{_appBaseUrl}/verify-email?token={encodedToken}&email={encodedEmail}";

                var subject = "Verify Your Email - BetterMe";
                var body = CreateVerificationEmailBody(displayName, verificationUrl);

                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send verification email: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string displayName)
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
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send password reset email: {ex.Message}");
                return false;
            }
        }

        public async Task<bool> SendWelcomeEmailAsync(string email, string displayName)
        {
            try
            {
                var subject = "Welcome to BetterMe!";
                var body = CreateWelcomeEmailBody(displayName);

                return await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send welcome email: {ex.Message}");
                return false;
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
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa;
        }}
        .container {{ 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }}
        .header {{ 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }}
        .header h1 {{ 
            margin: 0; 
            font-size: 2.5rem; 
            font-weight: 700;
        }}
        .header p {{
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1rem;
        }}
        .content {{ 
            padding: 40px 30px; 
        }}
        .greeting {{
            font-size: 1.3rem;
            color: #2d3748;
            margin-bottom: 20px;
        }}
        .message {{
            color: #4a5568;
            margin-bottom: 30px;
            font-size: 1.1rem;
        }}
        .button-container {{
            text-align: center;
            margin: 40px 0;
        }}
        .verify-button {{
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }}
        .verify-button:hover {{
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }}
        .link-text {{
            word-break: break-all; 
            background: #f7fafc; 
            padding: 15px; 
            border-radius: 8px; 
            font-size: 0.9rem;
            border: 1px solid #e2e8f0;
            margin: 20px 0;
            color: #4a5568;
        }}
        .expiry-note {{
            color: #718096;
            font-size: 0.9rem;
            margin-top: 30px;
            text-align: center;
        }}
        .footer {{ 
            text-align: center; 
            margin-top: 40px; 
            color: #718096; 
            font-size: 0.9rem;
            border-top: 1px solid #e2e8f0;
            padding-top: 30px;
        }}
        .support {{
            margin-top: 20px;
            color: #a0aec0;
        }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>BetterMe</h1>
            <p>Your personal productivity companion</p>
        </div>
        <div class='content'>
            <div class='greeting'>Hello {displayName}!</div>
            
            <div class='message'>
                Thank you for registering with BetterMe. We're excited to have you on board! 
                To complete your registration and start organizing your tasks, please verify your email address.
            </div>
            
            <div class='button-container'>
                <a href='{verificationUrl}' class='verify-button'>Verify Email Address</a>
            </div>
            
            <div class='message'>
                If the button doesn't work, copy and paste this link into your browser:
            </div>
            
            <div class='link-text'>{verificationUrl}</div>
            
            <div class='expiry-note'>
                This verification link will expire in 24 hours.
            </div>
            
            <div class='message'>
                If you didn't create an account with BetterMe, please ignore this email.
            </div>
        </div>
        <div class='footer'>
            <p>&copy; {DateTime.Now.Year} BetterMe. All rights reserved.</p>
            <div class='support'>
                Need help? Contact us at support@betterme.com
            </div>
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
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Password Reset</h1>
        </div>
        <div class='content'>
            <h2>Hello {displayName}!</h2>
            <p>You requested to reset your password for your BetterMe account.</p>
            <p>Click the button below to reset your password:</p>
            
            <p style='text-align: center; margin: 30px 0;'>
                <a href='{resetUrl}' class='button'>Reset Password</a>
            </p>
            
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
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
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to BetterMe!</h1>
        </div>
        <div class='content'>
            <h2>Hello {displayName}!</h2>
            <p>Welcome to BetterMe! Your email has been successfully verified and your account is now active.</p>
            <p>We're excited to help you organize your tasks and boost your productivity.</p>
            <p>Get started by:</p>
            <ul>
                <li>Creating your first task</li>
                <li>Exploring the calendar view</li>
                <li>Setting up categories for better organization</li>
            </ul>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy organizing! 🎉</p>
        </div>
    </div>
</body>
</html>";
        }

        private async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
        {
            // If no SMTP configuration, log and return true (for development)
            if (string.IsNullOrEmpty(_smtpUsername) || string.IsNullOrEmpty(_smtpPassword))
            {
                Console.WriteLine($"[EmailService] SMTP not configured. Would send email to: {toEmail}");
                Console.WriteLine($"[EmailService] Subject: {subject}");
                return true; // Return true to not block registration in development
            }

            try
            {
                using var client = new SmtpClient(_smtpHost, _smtpPort)
                {
                    Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                    EnableSsl = true,
                    Timeout = 10000 // 10 seconds timeout
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_fromEmail, _fromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = true
                };
                mailMessage.To.Add(toEmail);

                await client.SendMailAsync(mailMessage);

                Console.WriteLine($"[EmailService] Email sent successfully to: {toEmail}");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send email to {toEmail}: {ex.Message}");
                return false;
            }
        }
    }
}