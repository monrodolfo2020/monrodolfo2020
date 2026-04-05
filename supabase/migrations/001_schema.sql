CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TABLE agents (
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

CREATE TABLE knowledge_items (
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

CREATE TABLE embeddings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  knowledge_item_id UUID NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  agent_id          UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  chunk_index       INTEGER NOT NULL,
  chunk_text        TEXT NOT NULL,
  embedding         VECTOR(1536) NOT NULL,
  token_count       INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id      UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  visitor_id    TEXT,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_test       BOOLEAN NOT NULL DEFAULT FALSE,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id        UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  chunks_used     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_share_token ON agents(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_knowledge_agent_id ON knowledge_items(agent_id);
CREATE INDEX idx_knowledge_status ON knowledge_items(agent_id, status);
CREATE INDEX idx_embeddings_agent_id ON embeddings(agent_id);
CREATE INDEX idx_embeddings_vector ON embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
