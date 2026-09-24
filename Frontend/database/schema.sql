-- AC Monitoring System database schema
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'FACILITY_MANAGER',
  'TECHNICIAN',
  'VIEWER'
);

CREATE TYPE record_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE building_status AS ENUM ('ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE');
CREATE TYPE ac_status AS ENUM ('WORKING', 'FAULT', 'MAINTENANCE', 'UNKNOWN', 'OFFLINE');
CREATE TYPE maintenance_type AS ENUM ('PREVENTIVE', 'REPAIR', 'EMERGENCY', 'INSPECTION');
CREATE TYPE maintenance_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE priority_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE movement_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');
CREATE TYPE audit_entity_type AS ENUM ('AC', 'USER', 'MOVEMENT', 'MAINTENANCE', 'LOCATION', 'SYSTEM');

CREATE TABLE users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text,
  role user_role NOT NULL,
  department text,
  phone text,
  status record_status NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE buildings (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  description text,
  status building_status NOT NULL DEFAULT 'ACTIVE',
  layout jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE building_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id text NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  data_url text NOT NULL,
  is_cover boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX one_cover_photo_per_building
  ON building_photos (building_id)
  WHERE is_cover;

CREATE TABLE floors (
  id text PRIMARY KEY,
  building_id text NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  name text NOT NULL,
  floor_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (building_id, name)
);

CREATE TABLE departments (
  id text PRIMARY KEY,
  name text NOT NULL,
  floor_id text NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (floor_id, name)
);

CREATE TABLE rooms (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  floor_id text NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  room_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (floor_id, name)
);

CREATE TABLE ac_assets (
  id text PRIMARY KEY,
  make text NOT NULL,
  model text NOT NULL,
  capacity text NOT NULL,
  capacity_ton numeric(5,2),
  serial_number text NOT NULL UNIQUE,
  type text NOT NULL,
  manufacturing_year smallint,
  installation_year smallint,
  installation_date date,
  star_rating text,
  power_rating text,
  power_factor numeric(4,3),
  status ac_status NOT NULL DEFAULT 'UNKNOWN',
  last_maintenance_type text,
  last_maintenance_date date,
  next_maintenance_date date,
  technician_id text REFERENCES users(id) ON DELETE SET NULL,
  remarks text,
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  department_id text REFERENCES departments(id) ON DELETE SET NULL,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (capacity_ton IS NULL OR capacity_ton > 0),
  CHECK (power_factor IS NULL OR power_factor >= 0),
  CHECK (manufacturing_year IS NULL OR manufacturing_year BETWEEN 1900 AND 2200),
  CHECK (installation_year IS NULL OR installation_year BETWEEN 1900 AND 2200)
);

CREATE TABLE ac_location_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ac_id text NOT NULL REFERENCES ac_assets(id) ON DELETE CASCADE,
  from_room_id text REFERENCES rooms(id) ON DELETE SET NULL,
  to_room_id text NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  from_department_id text REFERENCES departments(id) ON DELETE SET NULL,
  to_department_id text REFERENCES departments(id) ON DELETE SET NULL,
  changed_by text REFERENCES users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  reason text
);

CREATE TABLE maintenance_jobs (
  id text PRIMARY KEY,
  ac_id text NOT NULL REFERENCES ac_assets(id) ON DELETE RESTRICT,
  type maintenance_type NOT NULL,
  status maintenance_status NOT NULL DEFAULT 'PENDING',
  priority priority_level NOT NULL DEFAULT 'MEDIUM',
  assigned_to text REFERENCES users(id) ON DELETE SET NULL,
  reported_by text REFERENCES users(id) ON DELETE SET NULL,
  description text NOT NULL,
  scheduled_date date NOT NULL,
  completed_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (completed_date IS NULL OR completed_date >= scheduled_date)
);

CREATE TABLE movement_requests (
  id text PRIMARY KEY,
  ac_id text NOT NULL REFERENCES ac_assets(id) ON DELETE RESTRICT,
  from_room_id text REFERENCES rooms(id) ON DELETE SET NULL,
  to_room_id text NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  requested_by text NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status movement_status NOT NULL DEFAULT 'PENDING',
  approved_by text REFERENCES users(id) ON DELETE SET NULL,
  request_date timestamptz NOT NULL DEFAULT now(),
  approved_date timestamptz,
  rejection_reason text,
  completed_date timestamptz,
  CHECK (status <> 'REJECTED' OR rejection_reason IS NOT NULL),
  CHECK (status NOT IN ('APPROVED', 'COMPLETED') OR approved_by IS NOT NULL),
  CHECK (status <> 'COMPLETED' OR completed_date IS NOT NULL)
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id text REFERENCES users(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  actor_role user_role,
  action text NOT NULL,
  entity_type audit_entity_type NOT NULL,
  entity_id text NOT NULL,
  details text,
  ip_address inet
);

CREATE TABLE import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imported_by text REFERENCES users(id) ON DELETE SET NULL,
  file_name text,
  source_label text NOT NULL DEFAULT 'Official College Dataset',
  total_rows integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  invalid_count integer NOT NULL DEFAULT 0,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE import_row_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  field text,
  problem text NOT NULL,
  action text,
  severity text NOT NULL,
  raw_data jsonb
);

CREATE INDEX floors_building_id_idx ON floors (building_id);
CREATE INDEX departments_floor_id_idx ON departments (floor_id);
CREATE INDEX rooms_floor_id_idx ON rooms (floor_id);
CREATE INDEX ac_assets_room_id_idx ON ac_assets (room_id);
CREATE INDEX ac_assets_status_idx ON ac_assets (status);
CREATE INDEX ac_assets_next_maintenance_date_idx ON ac_assets (next_maintenance_date);
CREATE INDEX maintenance_jobs_ac_id_idx ON maintenance_jobs (ac_id);
CREATE INDEX maintenance_jobs_status_date_idx ON maintenance_jobs (status, scheduled_date);
CREATE INDEX movement_requests_status_idx ON movement_requests (status);
CREATE INDEX movement_requests_ac_id_idx ON movement_requests (ac_id);
CREATE INDEX audit_logs_entity_idx ON audit_logs (entity_type, entity_id);
CREATE INDEX audit_logs_occurred_at_idx ON audit_logs (occurred_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER buildings_set_updated_at
  BEFORE UPDATE ON buildings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER ac_assets_set_updated_at
  BEFORE UPDATE ON ac_assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER maintenance_jobs_set_updated_at
  BEFORE UPDATE ON maintenance_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE VIEW ac_asset_directory AS
SELECT
  a.id,
  a.make,
  a.model,
  a.capacity,
  a.capacity_ton,
  a.serial_number,
  a.type,
  a.status,
  a.is_demo,
  a.last_maintenance_date,
  a.next_maintenance_date,
  b.id AS building_id,
  b.name AS building_name,
  f.id AS floor_id,
  f.name AS floor_name,
  d.id AS department_id,
  d.name AS department_name,
  r.id AS room_id,
  r.name AS room_name
FROM ac_assets a
JOIN rooms r ON r.id = a.room_id
JOIN floors f ON f.id = r.floor_id
JOIN buildings b ON b.id = f.building_id
LEFT JOIN departments d ON d.id = a.department_id;
