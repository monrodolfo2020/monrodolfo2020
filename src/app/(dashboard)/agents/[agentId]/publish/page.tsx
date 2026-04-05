"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Copy, Share2, Globe, GlobeLock, Loader2, Check, ExternalLink } from 'lucide-react'
import type { Agent } from '@/types'

export default function PublishPage() {
  const params = useParams()
  const agentId = params.agentId as string
  const [agent, setAgent] = useState<Agent | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/agents/${agentId}`).then(r => r.json()).then(setAgent)
  }, [agentId])

  const shareUrl = agent?.share_token
    ? `${window.location.origin}/share/${agent.share_token}`
    : null

  async function handlePublish() {
    setPublishing(true)
    const res = await fetch(`/api/agents/${agentId}/publish`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) setAgent(a => a ? { ...a, is_published: true, share_token: data.shareToken } : a)
    setPublishing(false)
  }

  async function handleUnpublish() {
    setPublishing(true)
    await fetch(`/api/agents/${agentId}/publish`, { method: 'DELETE' })
    setAgent(a => a ? { ...a, is_published: false } : a)
    setPublishing(false)
  }

  function copyLink() {
    if (shareUrl) { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }

  if (!agent) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild><Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div>
          <h1 className="text-2xl font-bold">Publicar agente</h1>
          <p className="text-muted-foreground text-sm">Comparte tu agente con el mundo</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${agent.is_published ? 'bg-green-100' : 'bg-slate-100'}`}>
                {agent.is_published ? <Globe className="w-6 h-6 text-green-600" /> : <GlobeLock className="w-6 h-6 text-slate-500" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{agent.name}</span>
                  {agent.is_published
                    ? <Badge variant="success">Publicado</Badge>
                    : <Badge variant="secondary">Borrador</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {agent.is_published ? 'Cualquiera con el link puede chatear con tu agente' : 'Tu agente aún no es público'}
                </p>
              </div>
            </div>
          </div>

          {agent.is_published && shareUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border">
                <Globe className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-sm font-mono text-slate-700 flex-1 truncate">{shareUrl}</span>
                <Button size="sm" variant="outline" onClick={copyLink} className="gap-1 flex-shrink-0">
                  {copied ? <><Check className="w-3.5 h-3.5" />Copiado</> : <><Copy className="w-3.5 h-3.5" />Copiar</>}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5" /></a>
                </Button>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                <strong>¿Cómo funciona?</strong> Comparte este link con tus clientes o empresas. Ellos podrán chatear con tu agente desde cualquier dispositivo, sin necesidad de crear una cuenta.
              </div>
              <Button variant="outline" onClick={handleUnpublish} disabled={publishing} className="w-full text-destructive hover:text-destructive">
                {publishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Despublicar agente
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-700">
                <strong>Antes de publicar:</strong> Asegúrate de que tu agente está entrenado con suficiente conocimiento y que has probado que responde correctamente.
              </div>
              <Button onClick={handlePublish} disabled={publishing} className="w-full gap-2" size="lg">
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                Publicar y generar link compartible
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-4 flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Estadísticas</div>
            <div className="text-xs text-muted-foreground">Uso de tu agente</div>
          </div>
          <div className="flex gap-6 text-center">
            <div><div className="text-xl font-bold">{agent.total_conversations}</div><div className="text-xs text-muted-foreground">Chats</div></div>
            <div><div className="text-xl font-bold">{agent.total_messages}</div><div className="text-xs text-muted-foreground">Mensajes</div></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
