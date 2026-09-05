CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('treasury', 'risk', 'executive', 'auditor', 'admin')),
  department TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS liquidity_flows (
  id TEXT PRIMARY KEY,
  operation_date TEXT NOT NULL,
  source_system TEXT NOT NULL,
  department TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  expected_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS liquidity_limits (
  id TEXT PRIMARY KEY,
  currency TEXT NOT NULL,
  department TEXT,
  limit_type TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  flow_id TEXT NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'cancelled')),
  route_name TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  assigned_to_role TEXT NOT NULL,
  decision_comment TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at TEXT,
  FOREIGN KEY (flow_id) REFERENCES liquidity_flows(id),
  FOREIGN KEY (requested_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  previous_hash TEXT,
  event_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS integration_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  endpoint_name TEXT NOT NULL,
  last_sync_at TEXT,
  status TEXT NOT NULL,
  owner_department TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notification_events (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  severity TEXT NOT NULL,
  recipient_role TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_liquidity_flows_date_currency
ON liquidity_flows(operation_date, currency);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status_role
ON approval_requests(status, assigned_to_role);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity
ON audit_events(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_events_created_at
ON audit_events(created_at);

