# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project file and restore
COPY backend/BetterMe.Api/BetterMe.Api.csproj .
RUN dotnet restore BetterMe.Api.csproj

# Copy everything else and build
COPY backend/BetterMe.Api/ .
RUN dotnet publish BetterMe.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

# Railway provides PORT environment variable
ENV ASPNETCORE_URLS=http://+:${PORT:-8080}
EXPOSE 8080

ENTRYPOINT ["dotnet", "BetterMe.Api.dll"]
