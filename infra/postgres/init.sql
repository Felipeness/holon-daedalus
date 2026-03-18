-- holon-minions database schema
-- Event sourcing + graph memory

-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extension for vector similarity (optional, for embeddings)
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- =============================================================================
-- Event Store (append-only)
-- =============================================================================

CREATE TABLE graph_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_id    UUID NOT NULL,
    type            TEXT NOT NULL,
    version         INTEGER NOT NULL,
    payload         JSONB NOT NULL DEFAULT '{}',
    idempotency_key TEXT NOT NULL,
    correlation_id  TEXT,
    causation_id    TEXT,
    source          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_aggregate_version UNIQUE (aggregate_id, version)
);

CREATE INDEX idx_graph_events_aggregate_id ON graph_events (aggregate_id);
CREATE INDEX idx_graph_events_type ON graph_events (type);
CREATE INDEX idx_graph_events_correlation_id ON graph_events (correlation_id);
CREATE INDEX idx_graph_events_created_at ON graph_events (created_at);
CREATE INDEX idx_graph_events_idempotency_key ON graph_events (idempotency_key);

-- =============================================================================
-- Entities (materialized view from events)
-- =============================================================================

CREATE TABLE entities (
    id              UUID PRIMARY KEY,
    type            TEXT NOT NULL CHECK (type IN (
        'FILE', 'FUNCTION', 'CLASS', 'MODULE',
        'TASK', 'BLUEPRINT', 'HOLON', 'DECISION', 'KNOWLEDGE'
    )),
    name            TEXT NOT NULL,
    properties      JSONB NOT NULL DEFAULT '{}',
    -- embedding    VECTOR(1536),  -- Uncomment when pgvector is available
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entities_type ON entities (type);
CREATE INDEX idx_entities_name ON entities (name);
CREATE INDEX idx_entities_properties ON entities USING GIN (properties);

-- =============================================================================
-- Relations (materialized view from events)
-- =============================================================================

CREATE TABLE relations (
    id              UUID PRIMARY KEY,
    from_id         UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    to_id           UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    type            TEXT NOT NULL CHECK (type IN (
        'DEPENDS_ON', 'CONTAINS', 'REFERENCES', 'PRODUCED_BY',
        'REVIEWED_BY', 'SIMILAR_TO', 'PARENT_OF', 'CHILD_OF'
    )),
    weight          REAL NOT NULL DEFAULT 1.0,
    properties      JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_from_to_type UNIQUE (from_id, to_id, type)
);

CREATE INDEX idx_relations_from_id ON relations (from_id);
CREATE INDEX idx_relations_to_id ON relations (to_id);
CREATE INDEX idx_relations_type ON relations (type);
CREATE INDEX idx_relations_weight ON relations (weight);

-- =============================================================================
-- Idempotency Keys
-- =============================================================================

CREATE TABLE idempotency_keys (
    key             TEXT PRIMARY KEY,
    result          JSONB NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys (expires_at);

-- =============================================================================
-- Cleanup function for expired idempotency keys
-- =============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM idempotency_keys WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
