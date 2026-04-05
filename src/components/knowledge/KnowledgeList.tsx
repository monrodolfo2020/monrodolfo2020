"use client"
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, PlayCircle, Globe, Mic, AlignLeft, Trash2, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import type { KnowledgeItem } from '@/types'

const TYPE_ICONS = {
  pdf: FileText, docx: FileText, txt: FileText,
  youtube: PlayCircle, url: Globe, audio: Mic, text: AlignLeft,
}

const TYPE_LABELS = {
  pdf: 'PDF', docx: 'Word', txt: 'Texto', youtube: 'YouTube', url: 'Web', audio: 'Audio', text: 'Texto',
}

function StatusBadge({ item }: { item: KnowledgeItem }) {
  if (item.status === 'ready') return <Badge variant="success" className="gap-1"><CheckCircle className="w-3 h-3" />Listo</Badge>
  if (item.status === 'error') return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Error</Badge>
  return <Badge variant="warning" className="gap-1"><Loader2 className="w-3 h-3 animate-spin" />Procesando...</Badge>
}

export function KnowledgeList({ initialItems, agentId }: { initialItems: KnowledgeItem[]; agentId: string }) {
  const [items, setItems] = useState<KnowledgeItem[]>(initialItems)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Poll processing items
  useEffect(() => {
    const processing = items.filter(i => i.status === 'processing')
    if (processing.length === 0) return

    const interval = setInterval(async () => {
      const updated = await Promise.all(
        processing.map(item =>
          fetch(`/api/knowledge/${item.id}`).then(r => r.json())
        )
      )
      setItems(prev => prev.map(item => {
        const u = updated.find(u => u?.id === item.id)
        return u ? { ...item, ...u } : item
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [items])

  // Listen for new uploads
  useEffect(() => {
    async function refresh() {
      const res = await fetch(`/api/agents/${agentId}/knowledge`)
      if (res.ok) setItems(await res.json())
    }
    window.addEventListener('knowledge-updated', refresh)
    return () => window.removeEventListener('knowledge-updated', refresh)
  }, [agentId])

  async function handleDelete(itemId: string) {
    if (!confirm('¿Eliminar este conocimiento? El agente olvidará esta información.')) return
    setDeleting(itemId)
    await fetch(`/api/knowledge/${itemId}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== itemId))
    setDeleting(null)
  }

  if (items.length === 0) return (
    <Card>
      <CardContent className="py-12 text-center">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="font-medium mb-1">Sin conocimiento aún</h3>
        <p className="text-sm text-muted-foreground">Añade documentos, videos o texto para entrenar a tu agente.</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Conocimiento del agente ({items.length})</h3>
      {items.map(item => {
        const Icon = TYPE_ICONS[item.source_type as keyof typeof TYPE_ICONS] || FileText
        return (
          <Card key={item.id}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{item.title}</span>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {TYPE_LABELS[item.source_type as keyof typeof TYPE_LABELS] || item.source_type}
                  </Badge>
                </div>
                {item.status === 'error' && item.error_message && (
                  <p className="text-xs text-destructive mt-0.5">{item.error_message}</p>
                )}
                {item.status === 'ready' && (
                  <p className="text-xs text-muted-foreground">{item.chunk_count} fragmentos procesados</p>
                )}
              </div>
              <StatusBadge item={item} />
              <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-destructive"
                onClick={() => handleDelete(item.id)} disabled={deleting === item.id}>
                {deleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
