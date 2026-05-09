-- Run once on Postgres. If tasks.id / users.id are BIGINT/SERIAL, change UUID columns and FK types to match.
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  task_id UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users (id),
  original_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_task_id_created_at ON messages (task_id, created_at ASC);
