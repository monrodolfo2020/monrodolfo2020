-- ================================================================
-- AgentForge — Migración Completa
-- Copia y pega TODO este contenido en:
-- https://supabase.com/dashboard/project/xyanjazchhpwfacmwbgy/sql/new
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE IF NOT EXISTS agents (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  description           TEXT,
  avatar_url            TEXT,
  tone                  TEXT NOT NULL DEFAULT 'professional',
  system_prompt         TEXT,
  model_id              TEXT NOT NULL DEFAULT 'qwen/qwen-2.5-7b-instruct:free',
  is_published          BOOLEAN NOT NULL DEFAULT FALSE,
  share_token           TEXT UNIQUE,
  total_conversations   INTEGER NOT NULL DEFAULT 0,
  total_messages        INTEGER NOT NULL DEFAULT 0,
  total_knowledge_items INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id      UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type   TEXT NOT NULL,
  title         TEXT NOT NULL,
  source_url    TEXT,
  storage_path  TEXT,
  raw_text      TEXT,
  status        TEXT NOT NULL DEFAULT 'processing',
  error_message TEXT,
  chunk_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS embeddings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_item_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  agent_id          UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  chunk_index       INTEGER NOT NULL,
  chunk_text        TEXT NOT NULL,
  embedding         VECTOR(1536) NOT NULL,
  token_count       INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id      UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  visitor_id    TEXT,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_test       BOOLEAN NOT NULL DEFAULT FALSE,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  chunks_used     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_share_token ON agents(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_agent_id ON knowledge_items(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_status ON knowledge_items(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_embeddings_agent_id ON embeddings(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

ALTER TABLE agents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agents_owner_all" ON agents;
CREATE POLICY "agents_owner_all" ON agents FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "agents_public_read" ON agents;
CREATE POLICY "agents_public_read" ON agents FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "knowledge_owner_all" ON knowledge_items;
CREATE POLICY "knowledge_owner_all" ON knowledge_items FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "embeddings_owner_read" ON embeddings;
CREATE POLICY "embeddings_owner_read" ON embeddings FOR SELECT USING (
  agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "conversations_public_insert" ON conversations;
CREATE POLICY "conversations_public_insert" ON conversations FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "conversations_owner_read" ON conversations;
CREATE POLICY "conversations_owner_read" ON conversations FOR SELECT USING (
  agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "messages_public_insert" ON messages;
CREATE POLICY "messages_public_insert" ON messages FOR INSERT WITH CHECK (TRUE);
DROP POLICY IF EXISTS "messages_owner_read" ON messages;
CREATE POLICY "messages_owner_read" ON messages FOR SELECT USING (
  agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
);

CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding  VECTOR(1536),
  match_agent_id   UUID,
  match_count      INT DEFAULT 5,
  match_threshold  FLOAT DEFAULT 0.65
)
RETURNS TABLE (chunk_text TEXT, similarity FLOAT, knowledge_item_id UUID, chunk_index INT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM agents WHERE id = match_agent_id
    AND (is_published = TRUE OR user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Agente no accesible';
  END IF;
  RETURN QUERY
  SELECT e.chunk_text,
    1 - (e.embedding <=> query_embedding) AS similarity,
    e.knowledge_item_id, e.chunk_index
  FROM embeddings e
  WHERE e.agent_id = match_agent_id
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS agents_updated_at ON agents;
CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
