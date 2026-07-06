# Gia SÆ° Platform

á»¨ng dá»¥ng ná»n táº£ng kiá»ƒm tra online cho giÃ¡o viÃªn/gia sÆ°/trung tÃ¢m, xÃ¢y dá»±ng báº±ng Next.js, Tailwind CSS vÃ  Prisma.

## CÃ i Ä‘áº·t

1. CÃ i dependencies:
   ```bash
   npm install
   ```
2. Táº¡o file `.env` tá»« máº«u:
   ```bash
   cp .env.example .env
   ```
3. Cháº¡y migration vÃ  seed dá»¯ liá»‡u:
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```
4. Cháº¡y á»©ng dá»¥ng:
   ```bash
   npm run dev
   ```

## ThÃ´ng tin chÃ­nh

- Frontend: Next.js 15, Tailwind CSS
- Backend: API route fullstack
- Database: Prisma + PostgreSQL
- Auth: JWT, role-based access control

## Structure

- `app/teacher` - trang teacher dashboard
- `app/student` - trang há»c sinh
- `app/api/auth` - API auth register/login/logout/refresh
- `prisma/schema.prisma` - mÃ´ hÃ¬nh dá»¯ liá»‡u

## MVP Ä‘Ã£ implement

- Auth email/password
- Teacher dashboard khung cÆ¡ báº£n
- Student test list
- Schema dá»¯ liá»‡u core cho teacher, lá»›p, cÃ¢u há»i, bÃ i test, attempt

## Cháº¡y thá»­

- Má»Ÿ `http://localhost:3000`
- Truy cáº­p `http://localhost:3000/teacher/dashboard`
- Truy cáº­p `http://localhost:3000/student/tests`
