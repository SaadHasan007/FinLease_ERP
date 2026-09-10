# FinLease ERP

FinLease ERP is a modern, enterprise-grade Finance and Leasing Enterprise Resource Planning (ERP) platform. It is designed to handle complex lifecycle management of financial applications, contracts, asset tracking, and comprehensive accounting.

## Project Overview
Built with a robust Python/FastAPI backend and a dynamic Expo/React Native frontend, FinLease ERP integrates AI/ML capabilities, a double-entry accounting engine, and a mobile-first user experience to streamline leasing operations.

## Key Features
- **AI/ML Integration**: Credit scoring and risk assessment using advanced machine learning models.
- **Accounting Engine**: Built-in double-entry accounting system with automated journal entries.
- **Mobile App**: Cross-platform mobile application for customer onboarding and document submission.
- **Role-Based Access Control**: Granular permissions for administrative, operational, and customer roles.

## Tech Stack
- **Backend**: Python 3.12, FastAPI, SQLAlchemy, Pydantic, PostgreSQL
- **Frontend**: React Native, Expo, TypeScript
- **Machine Learning**: Scikit-learn, XGBoost
- **DevOps**: Docker, GitHub Actions

## Architecture
The platform utilizes a 4-tier backend architecture:
1. **Routing Layer**: FastAPI endpoints and request validation.
2. **Service Layer**: Business logic and domain rules.
3. **Repository Layer**: Data access and database operations.
4. **Data Layer**: PostgreSQL database schema.

## Setup Instructions
The easiest way to run the application locally is using Docker Compose.

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/finlease-erp.git
   cd finlease-erp
   ```

2. Start the services:
   ```bash
   docker-compose up -d --build
   ```

3. Access the application:
   - Backend API Docs: `http://localhost:8000/docs`

## Documentation
- [System Architecture](docs/architecture/system-architecture.md)
- [Database ERD](docs/database/erd.md)
