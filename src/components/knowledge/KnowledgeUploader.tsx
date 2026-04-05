"use client"
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, PlayCircle, Globe, FileText, Mic, Loader2, CheckCircle } from 'lucide-react'

interface Props { agentId: string }

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

export function KnowledgeUploader({ agentId }: Props) {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)

  async function handleUpload(endpoint: string, body: FormData | object, isForm = false) {
    setStatus('uploading')
    setMessage('')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        ...(isForm ? { body: body as FormData } : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al procesar')
      }
      setStatus('success')
      setMessage('¡Añadido! Tu agente está aprendiendo este conocimiento...')
      setTimeout(() => { setStatus('idle'); setMessage('') }, 3000)
      window.dispatchEvent(new CustomEvent('knowledge-updated'))
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message)
    }
  }

  async function onFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    form.append('agentId', agentId)
    await handleUpload('/api/knowledge/upload', form, true)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function onAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    form.append('agentId', agentId)
    await handleUpload('/api/knowledge/audio', form, true)
    if (audioRef.current) audioRef.current.value = ''
  }

  function YoutubeForm() {
    const [url, setUrl] = useState('')
    return (
      <div className="space-y-3">
        <Label>URL del video de YouTube</Label>
        <Input placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={e => setUrl(e.target.value)} />
        <Button onClick={() => handleUpload('/api/knowledge/youtube', { url, agentId })} disabled={!url || status === 'uploading'} className="w-full">
          {status === 'uploading' ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Procesando...</> : 'Añadir video'}
        </Button>
      </div>
    )
  }

  function UrlForm() {
    const [url, setUrl] = useState('')
    return (
      <div className="space-y-3">
        <Label>URL de la página web</Label>
        <Input placeholder="https://www.ejemplo.com/articulo" value={url} onChange={e => setUrl(e.target.value)} />
        <Button onClick={() => handleUpload('/api/knowledge/url', { url, agentId })} disabled={!url || status === 'uploading'} className="w-full">
          {status === 'uploading' ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Procesando...</> : 'Añadir página'}
        </Button>
      </div>
    )
  }

  function TextForm() {
    const [text, setText] = useState('')
    const [title, setTitle] = useState('')
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Título <span className="text-muted-foreground">(opcional)</span></Label>
          <Input placeholder="Ej: Mi metodología de trabajo" value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Contenido *</Label>
          <Textarea placeholder="Pega aquí tu conocimiento: artículos, notas, metodologías, procesos..." value={text} onChange={e => setText(e.target.value)} rows={6} />
        </div>
        <Button onClick={() => handleUpload('/api/knowledge/text', { text, title, agentId })} disabled={!text || status === 'uploading'} className="w-full">
          {status === 'uploading' ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Procesando...</> : 'Añadir texto'}
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="font-semibold text-lg mb-4">Añadir conocimiento</h2>
        <Tabs defaultValue="document">
          <TabsList className="grid grid-cols-5 mb-6">
            <TabsTrigger value="document" className="gap-1"><Upload className="w-3.5 h-3.5" />Documento</TabsTrigger>
            <TabsTrigger value="audio" className="gap-1"><Mic className="w-3.5 h-3.5" />Audio</TabsTrigger>
            <TabsTrigger value="youtube" className="gap-1"><PlayCircle className="w-3.5 h-3.5" />YouTube</TabsTrigger>
            <TabsTrigger value="url" className="gap-1"><Globe className="w-3.5 h-3.5" />Web</TabsTrigger>
            <TabsTrigger value="text" className="gap-1"><FileText className="w-3.5 h-3.5" />Texto</TabsTrigger>
          </TabsList>

          <TabsContent value="document">
            <div className="space-y-3">
              <Label>Sube un documento PDF, Word o TXT</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-black transition-colors"
                onClick={() => fileRef.current?.click()}>
                {status === 'uploading' ? (
                  <><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-slate-400" /><p className="text-sm text-muted-foreground">Procesando tu documento...</p></>
                ) : (
                  <><Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" /><p className="text-sm font-medium">Haz clic para seleccionar un archivo</p><p className="text-xs text-muted-foreground">PDF, DOCX, TXT — máximo 50MB</p></>
                )}
              </div>
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={onFileUpload} />
            </div>
          </TabsContent>

          <TabsContent value="audio">
            <div className="space-y-3">
              <Label>Sube una grabación de audio (se transcribe automáticamente)</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-black transition-colors"
                onClick={() => audioRef.current?.click()}>
                {status === 'uploading' ? (
                  <><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-slate-400" /><p className="text-sm text-muted-foreground">Transcribiendo audio...</p></>
                ) : (
                  <><Mic className="w-8 h-8 mx-auto mb-2 text-slate-400" /><p className="text-sm font-medium">Haz clic para seleccionar audio</p><p className="text-xs text-muted-foreground">MP3, WAV, MP4 — máximo 25MB</p></>
                )}
              </div>
              <input ref={audioRef} type="file" accept=".mp3,.wav,.mp4,.m4a,.ogg" className="hidden" onChange={onAudioUpload} />
            </div>
          </TabsContent>

          <TabsContent value="youtube"><YoutubeForm /></TabsContent>
          <TabsContent value="url"><UrlForm /></TabsContent>
          <TabsContent value="text"><TextForm /></TabsContent>
        </Tabs>

        {status !== 'idle' && message && (
          <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg text-sm ${
            status === 'success' ? 'bg-green-50 text-green-700' :
            status === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {status === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
