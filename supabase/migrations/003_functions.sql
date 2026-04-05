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
CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
