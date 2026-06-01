-- Memoria Sparky por usuario (JSON agregado, sin PII).
-- Ejecutar en tu PostgreSQL del hosting (500GB+).

CREATE TABLE IF NOT EXISTS sparky_user_memory (
  user_id       VARCHAR(64)  PRIMARY KEY,
  memory_json   JSONB        NOT NULL DEFAULT '{}'::jsonb,
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sparky_user_memory_updated
  ON sparky_user_memory (updated_at DESC);

COMMENT ON TABLE sparky_user_memory IS 'Memoria local de Sparky sincronizada por usuario (bond, traits, companion, etc.)';
COMMENT ON COLUMN sparky_user_memory.memory_json IS 'Payload sanitizado; nunca email/teléfono/mensajes/GPS';
