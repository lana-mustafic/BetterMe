#  BetterMe: Full-Stack Task Management

A robust, full-stack web application for managing tasks, built using modern technologies in the Microsoft and Google ecosystems.

---

## Project Overview & Key Features

This project is a complete, authenticated To-Do application demonstrating proficiency in both backend API development and frontend single-page application (SPA) design.

### Core Features

* **User Authentication:** Secure registration and login using industry-standard **JWT (JSON Web Token)** for stateless authentication.
* **Task Management (CRUD):** Full Create, Read, Update, and Delete functionality for To-Do items.
* **Persistent Data:** Tasks and user data are stored and managed in a **SQL Server** database via Entity Framework Core.

### Technology Stack Highlights

| Component | Technology | Version | Notes |
| :--- | :--- | :--- | :--- |
| **Backend** | API Framework | **.NET 8 Web API** (C#) | High-performance, cross-platform backend. |
| **Frontend** | UI Framework | **Angular 20** | Modern SPA development framework. |
| **Database** | Persistence | **SQL Server** | Managed via Entity Framework Core. |
| **Authentication** | Security Standard | **JWT Bearer Authentication** | Used for securing API endpoints. |
| **Deployment** | Containerization | **Docker** | Configuration for containerizing the application components. |

---

## Repository Structure

The project is logically divided into separate directories for the API and the client application:

```bash
ToDoSolution/
├── backend/
│   └── ToDoApi/      # .NET 8 Web API project (Backend)
├── frontend/
│   └── todo-app/     # Angular 20 project (Frontend)
└── README.md
```

## ⚙️ Local Setup and Deployment

### Prerequisites

Ensure you have the following technologies installed and configured on your machine:

* **Backend:** [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* **Frontend:** [Node.js (LTS)](https://nodejs.org/en) and [Angular CLI](https://angular.io/cli)
* **Database:** **SQL Server** (or **SQL Server LocalDB**) installed and accessible.
* **Containerization:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required for running the Dockerized setup)

### 1. Backend API Setup (SQL Server)

1.  **Database Configuration:** Before running, ensure your database connection string in `backend/ToDoApi/appsettings.json` is configured correctly to point to your local SQL Server instance.
2.  Navigate to the API folder:
    
    ```bash
    cd backend/ToDoApi
    ```
3.  Restore dependencies:
    
    ```bash
    dotnet restore
    ```
4.  Apply database migrations (this creates the schema on your SQL Server instance):
  
    ```bash
    dotnet ef database update
    ```
5.  Run the API:
    
    ```bash
    dotnet run
    ```
    The API will typically run on `http://localhost:5000/` or a similar port.

### 2. Frontend Application Setup

1.  Navigate to the Angular folder:
   
    ```bash
    cd frontend/todo-app
    ```
2.  Install NPM dependencies:
   
    ```bash
    npm install
    ```
3.  Run the client:
   
    ```bash
    ng serve
    ```
    The frontend will be available at `http://localhost:4200/`.

### 3. Dockerized Deployment

```bash
docker-compose up --build
```


---

## 👤 Author

**Connect with me:**

[![GitHub](https://img.shields.io/badge/GitHub-lana--mustafic-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/lana-mustafic)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-lana--mustafic-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/lana-mustafic)

---
