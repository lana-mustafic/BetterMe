# Gamification System Integration Guide

This guide explains how to use the gamification components in your application.

## Components Created

1. **AchievementToastComponent** - Shows achievement notifications when unlocked
2. **LevelProgressBarComponent** - Displays level progress with points
3. **GamificationStatsComponent** - Shows comprehensive gamification stats
4. **LeaderboardComponent** - Displays leaderboard rankings

## Integration Examples

### 1. Achievement Toast (Global)

The achievement toast is already integrated in `app.ts` and will automatically show when achievements are unlocked.

### 2. Add Gamification Stats to Tasks Page

In your `tasks.component.ts`, add the stats widget:

```typescript
import { GamificationStatsComponent } from '../../components/gamification-stats/gamification-stats.component';

// In @Component decorator, add to imports:
imports: [
  // ... existing imports
  GamificationStatsComponent
],

// In template, add:
<app-gamification-stats></app-gamification-stats>
```

### 3. Add Level Progress Bar to Navbar

In `navbar.component.ts`:

```typescript
import { LevelProgressBarComponent } from '../level-progress-bar/level-progress-bar.component';

// Add to imports
imports: [
  // ... existing imports
  LevelProgressBarComponent
],

// In template, add:
<app-level-progress-bar [compact]="true"></app-level-progress-bar>
```

### 4. Create a Dedicated Gamification Page

Create a new route in `app.routes.ts`:

```typescript
import { GamificationPageComponent } from './pages/gamification/gamification-page.component';

{
  path: 'gamification',
  component: GamificationPageComponent,
  canActivate: [authGuard],
  data: { title: 'Gamification - BetterMe' }
}
```

Create `gamification-page.component.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationStatsComponent } from '../../components/gamification-stats/gamification-stats.component';
import { LeaderboardComponent } from '../../components/leaderboard/leaderboard.component';

@Component({
  selector: 'app-gamification-page',
  standalone: true,
  imports: [CommonModule, GamificationStatsComponent, LeaderboardComponent],
  template: `
    <div class="gamification-page">
      <div class="container">
        <h1>Gamification</h1>
        <app-gamification-stats></app-gamification-stats>
        <app-leaderboard></app-leaderboard>
      </div>
    </div>
  `,
  styles: [`
    .gamification-page {
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `]
})
export class GamificationPageComponent {}
```

## Service Usage

The `GamificationService` provides reactive observables:

```typescript
import { GamificationService } from './services/gamification.service';

// Inject service
private gamificationService = inject(GamificationService);

// Subscribe to stats
this.gamificationService.stats$.subscribe(stats => {
  console.log('Current stats:', stats);
});

// Subscribe to level system
this.gamificationService.levelSystem$.subscribe(levelSystem => {
  console.log('Level system:', levelSystem);
});

// Subscribe to new achievements
this.gamificationService.newAchievements$.subscribe(achievements => {
  console.log('New achievements:', achievements);
});

// Refresh data
this.gamificationService.refreshStats();
```

## API Endpoints

All endpoints are available at `/api/gamification`:

- `GET /api/gamification/stats` - Get user stats
- `GET /api/gamification/level-system` - Get level system
- `GET /api/gamification/achievements` - Get all achievements
- `GET /api/gamification/achievements/new` - Get new achievements
- `POST /api/gamification/achievements/{id}/mark-read` - Mark achievement as read
- `GET /api/gamification/leaderboard?limit=10` - Get leaderboard

## Points System

- **Base Points**: 10-30 points based on task priority (1-5)
- **On-Time Bonus**: +5 points for completing before/on due date
- **No Due Date Bonus**: +2 points for completing tasks without due dates
- **Streak Tracking**: Daily consecutive task completions

## Achievements

Achievements are automatically checked and awarded when:
- Tasks are completed
- Points thresholds are reached
- Streak milestones are hit
- Level milestones are reached

