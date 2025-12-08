# BetterMe — Full-Stack Productivity, Habits & Focus Platform

BetterMe is a modern, full-stack productivity and habit-tracking application designed to help users organize their lives, build strong habits, stay focused, and level up through gamification.

With a clean UI, powerful task management, deep analytics, reminders, collaboration, and a customizable focus system, BetterMe is built to be an all-in-one personal improvement platform.

---

## Demo Video

[![BetterMe Demo Video](https://img.youtube.com/vi/oWlCAHk0v_E/0.jpg)](https://youtu.be/oWlCAHk0v_E)

> Full walkthrough of BetterMe — a full-stack productivity, habit tracking & focus platform built with **ASP.NET Core 8** and **Angular 20**.

⚠️ Note: This project is under active development. Some features are still evolving.

---

# Features Overview

BetterMe combines advanced backend engineering with a smooth, fast, and interactive Angular UI.

## Core Modules
- **Task Management** — List, Kanban, Calendar, My Day, rich-text descriptions, tags, priorities  
- **Habit Tracking** — Streaks, completion history, analytics, reminders  
- **Focus Mode & Pomodoro** — Fully customizable, integrated with tasks  
- **Gamification** — Levels, points, achievements, streaks, leaderboards  
- **Collaboration** — Shared tasks, comments, assignments, activity feed  
- **Notifications** — Tasks, habits, achievements, system alerts  
- **Advanced Analytics** — Charts, insights, completion patterns, category distribution  
- **Natural Language Processing** — Smart parsing of dates, priorities, and tags  
- **Modern UI/UX** — Glassmorphism, dark/light mode, responsive, keyboard shortcuts  

---

# Tech Stack

## Backend (ASP.NET Core 8)
- C# + ASP.NET Core Web API  
- PostgreSQL + Entity Framework Core  
- JWT authentication with refresh tokens  
- Hangfire background jobs  
- AutoMapper, Repository Pattern, Service Layer  
- Swagger/OpenAPI documentation  
- Docker-ready infrastructure  

## Frontend (Angular 20 – Standalone Components)
- Angular + TypeScript  
- Angular CDK (drag & drop, overlays)  
- Chart.js + ng2-charts  
- Quill rich text editor  
- RxJS state management  
- Custom CSS (glassmorphism theme)  
- Fully responsive UI + SSR-ready  

---

# Detailed Feature Breakdown

## Authentication & User Profiles
- JWT login & registration  
- Password hashing, reset, change  
- Persistent sessions  
- Profile editing  
- User preferences & security controls  

---

## Advanced Task Management
- Smart NLP task creation (e.g., “Tomorrow at 3pm high priority pay bills #finance”)  
- Categories, tags, priorities, due dates  
- Rich text descriptions (Quill)  
- Subtasks, dependencies, recurring tasks  
- Attachments, reminders, activity feed  
- Multiple views:
  - **List View**
  - **Kanban Board**
  - **Calendar**
  - **My Day**

---

## Habit Tracking System
- Custom habits with frequency, difficulty, icons, color themes  
- Streak tracking + contribution grid  
- Habit analytics (charts, summaries, heatmaps)  
- Habit reminders  
- Today view / All habits / Stats view  

---

## Focus Mode (Pomodoro)
- Customizable work/break times  
- Session history  
- Time tracking per task  
- Distraction-free UI  
- Session analytics  

---

## Gamification
- Points for tasks & habits  
- Level system with XP  
- Achievements (streaks, milestones, completions)  
- Leaderboards  
- Streak stats and visualizations  

---

## Collaboration & Sharing
- Task sharing with permissions  
- Task assignment  
- Real-time threaded comments  
- Activity feed (audit log)  
- Shared templates  

---

## Analytics & Reporting
- Task completion trends  
- Category breakdown  
- Priority analysis  
- Weekly performance charts  
- Time tracking insights  

---

## Notifications
- Task reminders & overdue alerts  
- Habit notifications  
- Achievement notifications  
- Activity updates  
- Notification center with preferences  

---

# UI & UX Highlights
- Glassmorphism interface  
- Light / Dark / Auto themes  
- Custom accent colors  
- Fully mobile-responsive  
- Keyboard shortcuts  
- Skeleton loaders, empty states, onboarding tour  

---

# Project Architecture

## Backend Structure

```bash
BetterMe.Api/
├── Controllers/
├── Models/
├── DTOs/
├── Services/
├── Repositories/
├── Data/
└── Program.cs
```

**Architecture Principles**
- Repository Pattern  
- DI everywhere  
- DTO mapping with AutoMapper  
- Hangfire for async jobs  
- Validation & clean API boundaries  

---

## Frontend Structure 
```bash
betterme/
├── app/
│ ├── features/
│ ├── components/
│ ├── services/
│ ├── guards/
│ └── utils/
├── assets/
└── styles/
```


---

# Installation & Development

## Backend
```bash
cd BetterMe.Api
dotnet restore
dotnet ef database update
dotnet run
```

## Frontend
```bash
cd betterme
npm install
ng serve
```
---

# Roadmap (Future Enhancements)
- Data export (CSV/JSON)  
- Calendar syncing (Google/Microsoft)  
- Mobile app (Flutter / React Native)  
- Team workspaces & shared boards  
- AI suggestions & productivity insights  

---

# Contributing
Pull requests are welcome. For major changes, please open an issue first.

---

# License
This project is licensed under the MIT License.

---

# Support & Feedback
If you like this project, consider giving it a ⭐ on GitHub — it really helps!
