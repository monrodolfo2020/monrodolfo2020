-- ================================================================
-- FIX: match_embeddings — permitir llamadas desde service role
-- El cliente de servidor usa service_role key donde auth.uid() = NULL
-- Copia y pega en:
-- https://supabase.com/dashboard/project/xyanjazchhpwfacmwbgy/sql/new
-- ================================================================

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
  -- Allow service role calls (auth.uid() IS NULL) — already secured at API level
  -- For regular users, verify they own the agent or it's published
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
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
