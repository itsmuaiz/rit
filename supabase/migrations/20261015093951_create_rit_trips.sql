/*
# Create Rit trip records

1. New Tables
- `rit_trips` stores completed business trips created by the no-sign-in Rit app.
- `id` is the durable trip identifier.
- `device_id` identifies the local app installation so the app can restore its own trips.
- `started_at`, `ended_at`, `distance_km`, `start_address`, `end_address`, `description` store the trip summary.
- `route_points` stores measured GPS coordinates as JSON for drawing the recorded route.
- `created_at` records when the row was saved.

2. Security
- Row level security is enabled.
- Because this first version has no sign-in screen, anon and authenticated clients may use the table. The app scopes reads and writes to its locally generated device identifier.

3. Important notes
- GPS distance is supplied by the app after filtering location updates; no route distance is invented by the database.
- Existing data is preserved because all objects are created conditionally.
*/

CREATE TABLE IF NOT EXISTS public.rit_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  distance_km numeric(10, 3) NOT NULL DEFAULT 0,
  start_address text,
  end_address text,
  description text,
  route_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rit_trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_rit_trips" ON public.rit_trips;
CREATE POLICY "anon_select_rit_trips" ON public.rit_trips FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_rit_trips" ON public.rit_trips;
CREATE POLICY "anon_insert_rit_trips" ON public.rit_trips FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_rit_trips" ON public.rit_trips;
CREATE POLICY "anon_update_rit_trips" ON public.rit_trips FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_rit_trips" ON public.rit_trips;
CREATE POLICY "anon_delete_rit_trips" ON public.rit_trips FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS rit_trips_device_started_idx ON public.rit_trips (device_id, started_at DESC);
