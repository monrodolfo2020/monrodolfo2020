ALTER TABLE agents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agents_owner_all" ON agents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "agents_public_read" ON agents FOR SELECT USING (is_published = TRUE);

CREATE POLICY "knowledge_owner_all" ON knowledge_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "embeddings_owner_read" ON embeddings FOR SELECT USING (
  agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
);

CREATE POLICY "conversations_public_insert" ON conversations FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "conversations_owner_read" ON conversations FOR SELECT USING (
  agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
);
CREATE POLICY "messages_public_insert" ON messages FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "messages_owner_read" ON messages FOR SELECT USING (
  agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
);
