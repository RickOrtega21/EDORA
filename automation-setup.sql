-- 1. Enable Required Extensions
create extension if not exists "pg_net";
create extension if not exists "pg_cron";

-- 2. Create the automation schedule
-- This will run every Monday (1) and Thursday (4) at 08:00 AM
-- Replace YOUR_PROJECT_REF and YOUR_ANON_KEY if not using internal calls
SELECT cron.schedule(
    'weekly-reminders-monday',
    '0 8 * * 1',
    $$
    select
      net.http_post(
        url:='https://hmfbgynbkeskpvushgka.supabase.co/functions/v1/automated-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
);

SELECT cron.schedule(
    'weekly-reminders-thursday',
    '0 8 * * 4',
    $$
    select
      net.http_post(
        url:='https://hmfbgynbkeskpvushgka.supabase.co/functions/v1/automated-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
);

-- NOTE: You must replace YOUR_SERVICE_ROLE_KEY with your actual service_role key from Supabase Dashboard -> Settings -> API
