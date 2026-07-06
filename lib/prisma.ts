export const prisma = new Proxy(
  {},
  {
    get() {
      throw new Error('Prisma is no longer available to the frontend. Use backend-springboot REST APIs instead.');
    },
  }
) as never;
