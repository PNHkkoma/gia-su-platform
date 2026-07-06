# Gia Su Platform

Nền tảng kiểm tra online cho giáo viên/gia sư/trung tâm.

## Kiến trúc hiện tại

- Frontend: Next.js + Tailwind CSS.
- Backend chính: Spring Boot trong `backend-springboot`.
- Database: PostgreSQL, schema/migration hiện vẫn được quản lý bằng Prisma.
- Frontend không gọi Next API route trong `/app`; toàn bộ request nghiệp vụ đi qua `NEXT_PUBLIC_API_URL`, mặc định `http://localhost:8080/api/v1`.

## Cài đặt frontend

```bash
npm install
npm run dev
```

Nếu Java backend chạy ở URL khác:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1 npm run dev
```

## Cài đặt backend Spring Boot

```bash
cd backend-springboot
mvn spring-boot:run
```

Spring Boot dùng mặc định:

```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/giasu_platform
SPRING_DATASOURCE_USERNAME=giasu_user
SPRING_DATASOURCE_PASSWORD=giasu_password
```

## Database

Prisma hiện chỉ còn vai trò schema/migration/seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

Runtime frontend không import Prisma client.
