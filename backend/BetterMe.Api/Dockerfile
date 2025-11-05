# =========================
# BUILD STAGE
# =========================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy only the API project file first
COPY BetterMe.Api.csproj ./

# Restore dependencies for this project only
RUN dotnet restore BetterMe.Api.csproj

# Copy the rest of the project files
COPY . .

# Publish the application
RUN dotnet publish BetterMe.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# =========================
# RUNTIME STAGE
# =========================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Render expects the container to listen on port 8080
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

# Copy compiled app from build stage
COPY --from=build /app/publish .

# Start the app
ENTRYPOINT ["dotnet", "BetterMe.Api.dll"]
