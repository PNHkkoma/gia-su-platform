# Spring Boot Backend for Gia Su Platform

## Mục tiêu

- Tách backend khỏi Next.js.
- Dùng Spring Boot làm API server chính cho frontend.
- Frontend chỉ gọi REST API dưới `/api/v1`.

## Run

```bash
cd backend-springboot
mvn spring-boot:run
```

Datasource mặc định:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/giasu_platform
SPRING_DATASOURCE_USERNAME=giasu_user
SPRING_DATASOURCE_PASSWORD=giasu_password
```

## API contract

### Health

- GET `/api/v1/health`

### Auth

- POST `/api/v1/auth/login`
- POST `/api/v1/auth/register`
- POST `/api/v1/auth/logout`
- POST `/api/v1/auth/refresh`

### Teacher

- GET `/api/v1/teachers/dashboard`
- GET `/api/v1/teachers/classes`
- POST `/api/v1/teachers/classes`
- GET `/api/v1/teachers/tests`
- POST `/api/v1/teachers/tests`
- PATCH `/api/v1/teachers/tests/{slug}`
- DELETE `/api/v1/teachers/tests/{slug}`
- GET `/api/v1/teachers/questions`
- POST `/api/v1/teachers/questions`

### Student

- GET `/api/v1/students/tests`
- GET `/api/v1/students/tests/{slug}`
- GET `/api/v1/students/history`
- GET `/api/v1/students/profile`
- POST `/api/v1/students/tests/{slug}/start`
- POST `/api/v1/students/tests/{slug}/submit`
