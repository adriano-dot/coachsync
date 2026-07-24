-- Enable Supabase Realtime (postgres_changes) for the tasks table so the
-- coachee task list can reflect coach-side inserts/updates/deletes live.
alter publication supabase_realtime add table tasks;
