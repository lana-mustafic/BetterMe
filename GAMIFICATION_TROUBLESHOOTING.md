# Gamification System Troubleshooting Guide

## Common Issues and Solutions

### 1. Database Migration Not Run

**Problem**: The gamification tables don't exist in the database, causing errors when trying to award points.

**Solution**: Run the database migration:

```bash
cd backend/BetterMe.Api
dotnet ef database update
```

Or if the migration doesn't exist yet:
```bash
dotnet ef migrations add AddGamificationSystem
dotnet ef database update
```

### 2. Service Not Registered

**Problem**: `IGamificationService` is not registered in dependency injection.

**Check**: Verify in `Program.cs` that you have:
```csharp
builder.Services.AddScoped<IGamificationService, GamificationService>();
```

### 3. API Errors When Completing Tasks

**Problem**: Task completion fails with database errors.

**Solution**: The code now includes try-catch blocks to prevent gamification errors from breaking task completion. Check the console logs for:
```
[Gamification] Error awarding points: ...
```

### 4. Frontend Components Not Showing

**Problem**: Gamification components don't display or show errors.

**Check**:
1. Verify the components are imported in your page/component
2. Check browser console for errors
3. Verify the API endpoint is accessible: `GET /api/gamification/stats`
4. Check that you're authenticated (endpoints require authorization)

### 5. Points Not Being Awarded

**Problem**: Tasks are completed but no points are awarded.

**Check**:
1. Verify the migration has been run (see #1)
2. Check backend logs for gamification errors
3. Verify the task completion flow is calling `AwardTaskCompletionPointsAsync`
4. Check that `task.CompletedAt` is set before calling the gamification service

### 6. Achievements Not Unlocking

**Problem**: Achievements should unlock but don't.

**Check**:
1. Verify achievements are seeded in the database
2. Check that `CheckAndAwardAchievementsAsync` is being called
3. Verify achievement criteria match your stats
4. Check database for `UserAchievements` entries

## Testing the System

1. **Test Points Awarding**:
   - Complete a task
   - Check `UserGamifications` table for updated `TotalPoints`
   - Check `TaskCompletions` table for new entry

2. **Test Streaks**:
   - Complete tasks on consecutive days
   - Check `UserGamifications.CurrentStreak` increases

3. **Test Achievements**:
   - Complete your first task (should unlock "First Steps")
   - Check `UserAchievements` table for new entry
   - Check frontend for achievement toast notification

4. **Test API Endpoints**:
   ```bash
   # Get stats
   GET /api/gamification/stats
   
   # Get level system
   GET /api/gamification/level-system
   
   # Get achievements
   GET /api/gamification/achievements
   
   # Get leaderboard
   GET /api/gamification/leaderboard?limit=10
   ```

## Debug Steps

1. **Check Database Tables Exist**:
   ```sql
   SELECT * FROM "UserGamifications";
   SELECT * FROM "TaskCompletions";
   SELECT * FROM "Achievements";
   SELECT * FROM "UserAchievements";
   ```

2. **Check Service Registration**:
   - Verify `IGamificationService` is in `Program.cs`
   - Check that `GamificationService` constructor is being called

3. **Check Logs**:
   - Backend console for gamification errors
   - Frontend browser console for API errors
   - Network tab for failed API requests

4. **Verify Migration**:
   - Check `__EFMigrationsHistory` table for `AddGamificationSystem` entry
   - Verify migration file exists in `Data/Migrations/`

## Quick Fixes

If gamification is causing task completion to fail, the code now includes error handling that will:
- Log the error
- Continue with task completion
- Not throw exceptions

This ensures the core functionality (task completion) always works, even if gamification has issues.

