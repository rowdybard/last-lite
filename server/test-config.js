// Test configuration for Render PostgreSQL database
process.env.DATABASE_URL = 'postgresql://lastlite_db_user:uouwtzGJJziD1VcuBouINkJjkqhMOaSc@dpg-d2vs6uadbo4c73b0i780-a/lastlite_db';
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

console.log('Test configuration loaded with Render PostgreSQL database');
