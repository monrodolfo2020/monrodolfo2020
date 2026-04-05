import { chunkText } from './chunker'

export async function extractDocxText(buffer: Buffer): Promise<string[]> {
  const mammoth = await import('mammoth')
  const { value } = await mammoth.extractRawText({ buffer })
  return chunkText(value)
}
