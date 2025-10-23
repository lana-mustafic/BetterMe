#  BetterMe: Full-Stack Task Management

A robust, full-stack web application for managing tasks, built using modern technologies in the Microsoft and Google ecosystems.

---

## Project Overview & Key Features

This project is a complete, authenticated To-Do application demonstrating proficiency in both backend API development and frontend single-page application (SPA) design.

### Core Features

* **User Authentication:** Secure registration and login using industry-standard **JWT (JSON Web Token)** for stateless authentication.
* **Task Management (CRUD):** Full Create, Read, Update, and Delete functionality for To-Do items.
* **Persistent Data:** Tasks and user data are stored persistently using a relational database.

### Technology Stack Highlights

| Component | Technology | Version | Notes |
| :--- | :--- | :--- | :--- |
| **Backend** | API Framework | **.NET 8 Web API** (C#) | High-performance, cross-platform backend. |
| **Frontend** | UI Framework | **Angular 20** | Modern SPA development framework. |
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

* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* [Node.js (LTS)](https://nodejs.org/en)
* [Angular CLI](https://angular.io/cli)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Optional, for containerized setup)

### 1. Backend API Setup

1.  Navigate to the API folder:
    ```bash
    cd backend/ToDoApi
    ```
2.  Restore dependencies:
    ```bash
    dotnet restore
    ```
3.  (If using Entity Framework Core) Apply database migrations:
    ```bash
    dotnet ef database update
    ```
4.  Run the API:
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

If a `docker-compose.yml` file is included in the root, the entire application can be built and run using Docker:

```bash
docker-compose up --build
