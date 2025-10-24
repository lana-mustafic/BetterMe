using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BetterMe.Api.Data;
using BetterMe.Api.Models;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

// DEBUG: Log all environment variables
Console.WriteLine("=== ENVIRONMENT VARIABLES ===");
foreach (var envVar in Environment.GetEnvironmentVariables().Keys)
{
    Console.WriteLine($"{envVar} = {Environment.GetEnvironmentVariable(envVar.ToString())}");
}
Console.WriteLine("=== END ENVIRONMENT VARIABLES ===");

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddSqlServer<AppDbContext>(builder.Configuration.GetConnectionString("DefaultConnection"));

// JWT Configuration - with debugging
var jwtKeyFromEnv = Environment.GetEnvironmentVariable("JWT_KEY");
var jwtKeyFromConfig = builder.Configuration["Jwt:Key"];
Console.WriteLine($"DEBUG: JWT_KEY from environment = '{jwtKeyFromEnv}'");
Console.WriteLine($"DEBUG: Jwt:Key from configuration = '{jwtKeyFromConfig}'");

var key = jwtKeyFromEnv ?? jwtKeyFromConfig;
if (string.IsNullOrWhiteSpace(key))
{
    throw new InvalidOperationException("JWT_KEY is not set. Set env var JWT_KEY or Jwt:Key in configuration.");
}
else
{
    Console.WriteLine($"DEBUG: Using JWT key (length: {key.Length})");
}

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

// JWT setup
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey,
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Seed data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();
    SeedData.Initialize(context);
}

app.Run();
