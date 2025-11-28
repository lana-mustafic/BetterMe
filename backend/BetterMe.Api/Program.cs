using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BetterMe.Api.Data;
using BetterMe.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using BetterMe.Api.Services;
using BetterMe.Api.Services.Interfaces;
using BetterMe.Api.Repositories.Interfaces;
using BetterMe.Api.Repositories.Concrete;
using AutoMapper;
using BetterMe.Api.Services.Concrete;
using BetterMe.Api.Filters;
using Hangfire;
using Hangfire.PostgreSql;
using Hangfire.Common;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "https://betterme-frontend.onrender.com",
                "http://localhost:4200"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .WithExposedHeaders("Content-Disposition"); // Optional: for file downloads
    });
    
    // Add a named policy for better control
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "https://betterme-frontend.onrender.com",
                "http://localhost:4200"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .WithExposedHeaders("Content-Disposition");
    });
});

// Database (PostgreSQL)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException("ConnectionStrings__DefaultConnection is missing.");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

// Hangfire for background jobs
builder.Services.AddHangfire(config =>
{
    config.UsePostgreSqlStorage(connectionString);
});
builder.Services.AddHangfireServer();

// JWT Authentication
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ?? builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException("JWT key missing.");

var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddAutoMapper(typeof(Program));
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// Repositories
builder.Services.AddScoped<IUserRepository, UsersRepository>();
builder.Services.AddScoped<ITodoTasksRepository, TodoTasksRepository>();
builder.Services.AddScoped<ITagRepository, TagRepository>();

// Services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITodoTaskService, TodoTaskService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IHabitService, HabitService>();
builder.Services.AddScoped<IFocusSessionService, FocusSessionService>();
builder.Services.AddScoped<ITaskTemplateService, TaskTemplateService>();
builder.Services.AddScoped<ICollaborationService, CollaborationService>();
builder.Services.AddScoped<INaturalLanguageParser, NaturalLanguageParser>();
builder.Services.AddScoped<IReminderService, ReminderService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IGamificationService, GamificationService>();
builder.Services.AddScoped<ReminderBackgroundJob>();

var app = builder.Build();

app.UseRouting();

// CORS must be after routing but before authentication/authorization
app.UseCors();

// Swagger UI only in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

// Hangfire Dashboard (only in development)
if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard("/hangfire", new Hangfire.DashboardOptions
    {
        Authorization = new[] { new HangfireAuthorizationFilter() }
    });
}

app.MapControllers();

// Apply Migrations + Seed Database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.Migrate();
    SeedData.Initialize(context);
}

// Schedule recurring job for processing reminders (runs every minute)
// Use service-based API instead of static API - must be done after app is built
try
{
    using (var scope = app.Services.CreateScope())
    {
        var recurringJobManager = scope.ServiceProvider.GetRequiredService<IRecurringJobManager>();
        recurringJobManager.AddOrUpdate<ReminderBackgroundJob>(
            "process-due-reminders",
            job => job.ProcessDueReminders(),
            Cron.Minutely);
    }
}
catch (Exception ex)
{
    // Log error but don't fail startup if Hangfire isn't available
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogWarning(ex, "Failed to set up Hangfire recurring job. Background jobs may not work.");
}

// Render Dynamic Port Binding
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Urls.Clear();
app.Urls.Add($"http://0.0.0.0:{port}");

app.MapGet("/", () => Results.Ok("BetterMe API is running!"));

app.Run();