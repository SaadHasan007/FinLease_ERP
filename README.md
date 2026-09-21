# FinLease ERP

FinLease ERP is a finance and leasing management platform built for handling applications, contracts, collections, assets, accounting, and customer operations in a single system.

## Overview

This repository contains the core application source for a full-stack ERP system:

- Python FastAPI backend for business logic and APIs
- React + Vite frontend for the admin web experience
- React Native / Expo mobile app for field and customer-focused workflows
- PostgreSQL + Redis setup for local development and containerized deployment
- Docker-based environment for quick onboarding

## Key Features

- Loan and lease application lifecycle management
- Contract and asset tracking
- Accounting and financial reconciliation workflows
- Collections and payment monitoring
- Role-based access and authentication
- API-first architecture with modular services and repositories
- Mobile-ready structure for operational access

## Tech Stack

- Backend: Python, FastAPI, SQLAlchemy, Pydantic, PostgreSQL
- Frontend: React, Vite, TypeScript, Tailwind CSS
- Mobile: React Native, Expo
- Infra: Docker, Docker Compose
- Tooling: pytest, Playwright

## Repository Structure

```text
.
├── backend/                 # FastAPI backend source, tests, and config
├── frontend/                # Web application source
├── mobile/                  # Mobile app source
├── docs/                    # Product and architecture documentation
├── docker-compose.yml       # Local development stack
├── docker-compose.test.yml  # Test environment stack
├── .env.example             # Sample environment variables
├── .gitignore               # Ignore rules for local environment files and build artifacts
├── README.md                # Project overview and setup guide
└── LICENSE                  # Optional project license (if added later)
```

> This repository intentionally keeps only the core ERP application source. Generated QA assets, document conversion scripts, and report-generation utilities are excluded from the published GitHub project.

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/<your-github-username>/FinLease_ERP.git
cd FinLease_ERP
```

### 2. Configure environment variables

Copy the sample environment file and adjust values as needed:

```bash
cp .env.example .env
```

### 3. Start the services

```bash
docker-compose up --build
```

This starts:

- PostgreSQL database
- Redis
- FastAPI backend on port 8000
- Adminer on port 8080 (optional dev profile)

### 4. Run the frontend locally

```bash
cd frontend
npm install
npm run dev
```

### 5. Run the backend directly (optional)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Application URLs

- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:5173

## Documentation

- Backend docs and domain modules are included under the backend app structure
- Architecture notes and database references are in the docs folder

## Notes for Publishing

This repository is meant to contain the production-relevant application code and setup files only. Generated testing artifacts, Excel/Word QA exports, and helper utilities for report conversion are kept out of the GitHub repository to keep the project clean and maintainable.

## License

This project does not currently declare a public license. Add one if you intend to distribute it publicly.
