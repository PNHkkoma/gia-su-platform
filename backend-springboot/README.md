# Spring Boot Backend for Gia Su Platform

## Má»¥c tiÃªu
- TÃ¡ch backend khá»i Next.js
- DÃ¹ng Spring Boot lÃ m API server cho frontend
- Chuáº©n hÃ³a contract API cho tá»«ng module

## Run
```bash
cd backend-springboot
mvn spring-boot:run
```

## API contract

### Health
- GET /api/v1/health

### Auth
- POST /api/v1/auth/login
  - body: {"email":"...","password":"..."}
- POST /api/v1/auth/register
  - body: {"email":"...","password":"...","fullName":"...","role":"STUDENT|TEACHER"}
- POST /api/v1/auth/logout
- POST /api/v1/auth/refresh

### Teacher
- GET /api/v1/teachers/classes
- POST /api/v1/teachers/classes
- GET /api/v1/teachers/tests
- POST /api/v1/teachers/tests
- GET /api/v1/teachers/questions
- POST /api/v1/teachers/questions

### Student
- GET /api/v1/students/tests
- GET /api/v1/students/history
- GET /api/v1/students/profile
- POST /api/v1/students/tests/{testId}/start
- POST /api/v1/students/tests/{testId}/submit

## Frontend -> Backend flow
- Frontend Next.js sáº½ gá»i backend qua REST API
- Má»—i mÃ n hÃ¬nh cÃ³ má»™t nhÃ³m endpoint riÃªng
- Authentication dÃ¹ng JWT hoáº·c session cookie
