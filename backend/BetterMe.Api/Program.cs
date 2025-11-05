using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using BetterMe.Api.Data;
using BetterMe.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Controllers & Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

//Database (PostgreSQL)
builder.Services.AddDbContext<AppDbContext>(options =>
{
    // Render will override this with ConnectionStrings__DefaultConnection env var
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    if (string.IsNullOrWhiteSpace(connectionString))
        throw new InvalidOperationException("Connection string not found. Set ConnectionStrings__DefaultConnection.");

    options.UseNpgsql(connectionString);
});

//JWT Authentication
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ?? builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException("JWT key missing. Set JWT_KEY env var or Jwt:Key in appsettings.json.");

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
builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

var app = builder.Build();

// Swagger
app.UseSwagger();
app.UseSwaggerUI();


// Auth + Routing
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Apply Migrations Automatically 
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.Migrate();
    SeedData.Initialize(context);
}

//Render Port Binding
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    app.Urls.Add($"http://0.0.0.0:{port}");
}

app.Run();
