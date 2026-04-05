export interface Agent {
  id: string
  user_id: string
  name: string
  description: string | null
  avatar_url: string | null
  tone: string
  system_prompt: string | null
  model_id: string
  is_published: boolean
  share_token: string | null
  total_conversations: number
  total_messages: number
  total_knowledge_items: number
  created_at: string
  updated_at: string
}

export interface KnowledgeItem {
  id: string
  agent_id: string
  user_id: string
  source_type: 'pdf' | 'docx' | 'audio' | 'youtube' | 'url' | 'text'
  title: string
  source_url: string | null
  storage_path: string | null
  status: 'processing' | 'ready' | 'error'
  error_message: string | null
  chunk_count: number
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  agent_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
