# ---------- Build stage ----------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy and restore project file only
COPY BetterMe.Api.csproj .
RUN dotnet restore BetterMe.Api.csproj

# Copy the rest and build
COPY . .
RUN dotnet publish BetterMe.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# ---------- Runtime stage ----------
# Use non-Alpine image to avoid globalization issues
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish ./

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "BetterMe.Api.dll"]
