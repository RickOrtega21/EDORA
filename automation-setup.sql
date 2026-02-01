-- 1. Enable Required Extensions
create extension if not exists "pg_net";
create extension if not exists "pg_cron";

-- 2. Create the automation schedule
-- This will run every Monday (1) and Thursday (4) at 08:00 AM
-- Using the provided service_role key for internal authorization
SELECT cron.schedule(
    'weekly-reminders-monday',
    '0 8 * * 1',
    $$
    select
      net.http_post(
        url:='https://hmfbgynbkeskpvushgka.supabase.co/functions/v1/automated-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtZmJneW5ia2Vza3B2dXNoZ2thIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM4MzI1OCwiZXhwIjoyMDg0OTU5MjU4fQ.aDjSasLukbUzJlYXFnDzRO_EZFZN44w-OZ_H-Qy0HrA"}'::jsonb,
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
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhtZmJneW5ia2Vza3B2dXNoZ2thIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM4MzI1OCwiZXhwIjoyMDg0OTU5MjU4fQ.aDjSasLukbUzJlYXFnDzRO_EZFZN44w-OZ_H-Qy0HrA"}'::jsonb,
        body:='{}'::jsonb
      ) as request_id;
    $$
);
