# System Architecture

The FinLease ERP system is designed to be highly modular, scalable, and maintainable. It leverages modern architectural patterns to ensure separation of concerns and robust performance.

## Backend Architecture (4-Tier)
The backend is built with FastAPI and follows a 4-tier architecture:

1. **Routing Layer (Controllers)**
   - Handles incoming HTTP requests and responses.
   - Performs initial request validation using Pydantic models.
   - Delegates business logic to the Service Layer.

2. **Service Layer (Business Logic)**
   - Contains the core business rules and orchestration logic.
   - Interfaces with the ML models for credit scoring.
   - Manages transactions and interactions between different domains.

3. **Repository Layer (Data Access)**
   - Abstracts database operations using SQLAlchemy.
   - Provides a clean interface for the Service Layer to interact with data.

4. **Data Layer (Database)**
   - PostgreSQL 15 database storing all application data.
   - Uses asynchronous database drivers (asyncpg) for high concurrency.

## Frontend Architecture
- **Expo / React Native**: Provides a cross-platform mobile application tailored for both iOS and Android.
- Connects to the backend via RESTful APIs.

## Database
- **PostgreSQL**: Chosen for its robust feature set, ACIDs compliance, and support for JSONB data types which are utilized for flexible metadata storage.
