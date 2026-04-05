import OpenAI from 'openai'
import { chunkText } from './chunker'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function transcribeAudio(buffer: Buffer, filename: string): Promise<string[]> {
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
  const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
  const file = new File([blob], filename, { type: 'audio/mpeg' })
  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'es',
  })
  return chunkText(response.text)
}
