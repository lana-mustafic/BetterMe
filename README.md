<div align="center">

# BetterMe — Personal Productivity & Habit Tracking App

A modern full-stack productivity app to help users **organize daily tasks, build habits, track progress, and stay accountable**.

</div>

---

| Frontend | Backend (Swagger API) |
|---------|------------------------|
| **https://betterme-frontend.onrender.com** | **https://betterme-pihl.onrender.com/swagger/index.html** |

> **Note:** If the backend takes a few seconds to respond — Render may be waking the server. Just retry once. 😊

---




## Project Overview

BetterMe is a full-stack productivity and habit-tracking application built using .NET 8 for the backend and Angular 20 for the frontend.
It provides a smooth user experience for managing tasks, building habits, tracking progress, and maintaining personal discipline — all with a secure and modern architecture.

This project is ideal for:

- Demonstrating strong full-stack engineering skills

- Showcasing secure authentication and authorization flows

- Practicing API + Frontend integration and state management

- Serving as a base for more advanced personal productivity or business applications

---

## Features

- ✅ **User Authentication** (Register, Login, JWT-based sessions)
- ✅ **Profile Management**
- ✅ **Create & Manage Tasks**
- ✅ **Support for Recurring / Habit Tasks**
- ✅ **Tag System** for categorizing tasks
- ✅ **Progress tracking**
- ✅ **Responsive UI for mobile & desktop**
- ✅ **Protected routes & secure API endpoints**

---


## Repository Structure
Here is the top-level layout:

```bash
BetterMe/
├── backend/ # .NET 8 Web API project (C#)
│ └── BetterMe.Api/
├── frontend/ # Angular 20 SPA project
│ └── betterme/
├── .gitignore
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Prerequisites

- .NET 8 SDK installed on your development machine.  
- Node.js (LTS) + Angular CLI installed.  
- SQL Server (or compatible) installed and accessible (LocalDB or other).  
- Docker Desktop (optional but recommended for containerized setup).  

---

### Local Setup

#### 1. Backend API Setup
```bash
cd backend/BetterMe.Api
# Configure connection string in appsettings.json to point at your SQL Server instance
dotnet restore
dotnet ef database update    # Applies any migrations, creates schema
dotnet run                   # Runs the API (typically at http://localhost:5000 or similar)
```

### 2. Frontend Application Setup
```bash
cd frontend/betterme
npm install
ng serve                     # Launches the Angular app (typically at http://localhost:4200)
```

### 3. Dockerized Deployment

From the root of the repo:
```bash
docker-compose up --build
```
## Usage

- Navigate to the frontend URL (e.g., http://localhost:4200).  
- Register a new user or login.  
- Create, view, edit, and delete tasks.  
- Filter or sort tasks by status, due date.  
- Explore the API endpoints (e.g., via Swagger or Postman).

---

## Author

**Lana Mustafić**

Feel free to reach out or connect with me:

<div align="left" style="margin-top: 8px;">

  <a href="mailto:lana-mustafic@outlook.com" target="_blank">
    <img src="https://skillicons.dev/icons?i=gmail" width="45" height="45" alt="Email"/>
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://linkedin.com/in/lana-mustafic" target="_blank">
    <img src="https://skillicons.dev/icons?i=linkedin" width="45" height="45" alt="LinkedIn"/>
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="https://github.com/lana-mustafic" target="_blank">
    <img src="https://skillicons.dev/icons?i=github" width="45" height="45" alt="GitHub"/>
  </a>

</div>

I’m passionate about building structured, maintainable applications, improving my full-stack skills, and leveraging best practices in real-world systems.


---

## Contributing

Contributions are very welcome! If you’d like to:

1. Fork the repository.  
2. Create a feature branch (`git checkout -b feature/YourFeature`).  
3. Commit your changes (`git commit -m 'Add YourFeature'`).  
4. Push to your branch (`git push origin feature/YourFeature`).  
5. Open a Pull Request – I’ll review and provide feedback.  

Please follow the existing code style and include documentation/tests where appropriate.  

---

## Acknowledgements

- Thanks to all developers and open-source libraries that make full-stack development accessible.  
- Inspired by modern web architecture patterns and container-first deployment strategies.  
