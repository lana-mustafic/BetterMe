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

// ---- Connection string helper (Railway-friendly) ----
static string GetPgConnectionString(IConfiguration config)
{
    // 1) Prefer DATABASE_URL if present (Railway often provides this)
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrWhiteSpace(databaseUrl))
    {
        // databaseUrl format: postgresql://user:pass@host:port/dbname
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':', 2);
        var user = userInfo[0];
        var pass = userInfo.Length > 1 ? userInfo[1] : "";
        var host = uri.Host;
        var port = uri.Port;
        var db = uri.AbsolutePath.TrimStart('/');

        // Key=value format for Npgsql
        return $"Host={host};Port={port};Database={db};Username={user};Password={pass};Ssl Mode=Require;Trust Server Certificate=true";
    }

    // 2) Fallback to ConnectionStrings:DefaultConnection (works with env var ConnectionStrings__DefaultConnection)
    var cs = config.GetConnectionString("DefaultConnection");
    if (string.IsNullOrWhiteSpace(cs))
        throw new InvalidOperationException("Database connection string is not configured. Set DATABASE_URL or ConnectionStrings__DefaultConnection.");
    return cs;
}

// ---- Database (PostgreSQL via Npgsql) ----
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(GetPgConnectionString(builder.Configuration)));

// ---- JWT configuration ----
var key = Environment.GetEnvironmentVariable("JWT_KEY") ?? builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(key))
{
    throw new InvalidOperationException("JWT_KEY is not set. Provide JWT_KEY env var or Jwt:Key in configuration.");
}

builder.Services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

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

// Swagger in Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// If you're behind a proxy/ingress (Railway is), HTTPS is terminated before Kestrel.
// app.UseHttpsRedirection();  // keep or remove; it’s fine either way in containers.

// AuthN/Z & endpoints
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ---- Apply migrations and seed on startup (PROD-safe) ----
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Apply pending EF Core migrations (creates DB if missing)
    context.Database.Migrate();

    // Your custom seeding
    SeedData.Initialize(context);
}

// ---- Bind to PORT if present (useful when NOT using Docker) ----
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    app.Urls.Add($"http://0.0.0.0:{port}");
}

app.Run();
