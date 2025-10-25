# BetterMe 🧠
**Full-stack Task Management Web App**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-0A84FF?style=for-the-badge&logoColor=white&logo=azuredevops)](YOUR_DEPLOYMENT_URL)

---




## Project Overview

BetterMe is a robust, full-stack web application designed to manage tasks (a To-Do app) built using modern technologies: a backend API with **.NET 8** and a frontend SPA with **Angular 20**.  
It emphasizes best practices: JWT-based authentication, role-based access, task CRUD, filters, and containerized deployment with Docker.

This project is ideal for:
- Demonstrating proficiency in backend + frontend full-stack development.  
- Showcasing secure authentication and authorization workflows.  
- Practicing deployment workflows (Docker, CI/CD).  
- Serving as a foundation for larger productivity or business applications.  

---

## Key Features

- **Authentication & Authorization** – Users can register and login; secure endpoints via JWT tokens and role-based authorization.  
- **Task Management (CRUD)** – Create, Read, Update, Delete tasks; tasks can be assigned, filtered, sorted, and marked complete.  
- **Persistent Data Layer** – Built on SQL Server (or compatible) via Entity Framework Core for schema, migrations, and data access.  
- **Modern Frontend SPA** – Responsive UI built with Angular 20, communicates with backend API, handles user sessions, task views.  
- **Deployment Ready** – Dockerfile(s) + docker-compose setup allow you to containerize both backend and frontend (and database) for easy deployment.  
- **Clean Architecture / Folder Structure** – Logical separation of concerns: backend and frontend folders, config, and settings neatly organized.  

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