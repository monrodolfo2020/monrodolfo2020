import { chunkText } from './chunker'

export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export async function extractYoutubeTranscript(url: string): Promise<string[]> {
  const videoId = extractYoutubeId(url)
  if (!videoId) throw new Error('URL de YouTube no válida')

  const { YoutubeTranscript } = await import('youtube-transcript')
  const segments = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'es' })
    .catch(() => YoutubeTranscript.fetchTranscript(videoId))

  const fullText = segments.map(s => s.text).join(' ')
  return chunkText(fullText)
}
