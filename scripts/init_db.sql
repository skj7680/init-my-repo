-- Initialize database with basic setup
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create indexes for better performance
-- These will be created by Alembic migrations, but included here for reference

-- Example initial data (optional)
-- INSERT INTO users (username, email, hashed_password, role) 
-- VALUES ('admin', 'admin@cattle.com', '$2b$12$...', 'admin');
