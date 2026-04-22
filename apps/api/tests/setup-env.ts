process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-1234567890';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./test.db';
