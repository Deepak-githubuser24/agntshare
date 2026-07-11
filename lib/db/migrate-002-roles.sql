-- Create the least-privilege role for the application runtime
CREATE ROLE agentshare_app WITH LOGIN PASSWORD 'agentshare_app_password';

-- Grant least-privilege access only to the 7 application tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE users, assets, pathway_tokens, audit_logs, api_keys, analytics_events, waitlist_emails TO agentshare_app;

-- Grant usage on sequences so auto-incrementing primary keys work
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO agentshare_app;

-- Revoke SUPERUSER from the original 'user' role
ALTER ROLE "user" NOSUPERUSER;
