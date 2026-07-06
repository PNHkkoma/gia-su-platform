# API Specification cho Gia Su Platform

## 1. Auth
### POST /api/v1/auth/login
Request:
```json
{
  "email": "student@example.com",
  "password": "12345678"
}
```
Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "fullName": "Nguyen Van A",
      "role": "STUDENT"
    }
  },
  "error": null
}
```

### POST /api/v1/auth/register
Request:
```json
{
  "email": "teacher@example.com",
  "password": "12345678",
  "fullName": "Le Thi B",
  "role": "TEACHER"
}
```

### POST /api/v1/auth/logout
No body.

### POST /api/v1/auth/refresh
Header: Authorization: Bearer <refresh_token>

## 2. Teacher APIs
### GET /api/v1/teachers/classes
Response: list of classes created by current teacher.

### POST /api/v1/teachers/classes
Request: {"name":"Lớp Toán 10","subject":"Toán","level":"10"}

### GET /api/v1/teachers/tests
Response: list of tests created by current teacher.

### POST /api/v1/teachers/tests
Request: {"title":"Kiểm tra 15 phút","description":"...","durationMinutes":30}

### GET /api/v1/teachers/questions
Response: list of questions created by teacher.

### POST /api/v1/teachers/questions
Request: {"content":"Câu hỏi","type":"SINGLE_CHOICE","subject":"Toán","topic":"Đại số","difficulty":"EASY"}

## 3. Student APIs
### GET /api/v1/students/tests
Response: list of available tests for student.

### GET /api/v1/students/history
Response: history of attempted tests.

### GET /api/v1/students/profile
Response: student profile data.

### POST /api/v1/students/tests/{testId}/start
Response: start attempt metadata.

### POST /api/v1/students/tests/{testId}/submit
Request: submitted answers.

## 4. Quy tắc frontend -> backend
- Frontend chỉ gọi backend qua REST API.
- Mỗi trang Next.js nên có một service riêng, ví dụ:
  - auth.service.ts
  - teacher.service.ts
  - student.service.ts
- Mỗi API nên có response chuẩn:
```json
{
  "success": true,
  "data": {},
  "error": null
}
```
