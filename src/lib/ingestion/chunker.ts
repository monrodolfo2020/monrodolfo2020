export function chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  if (words.length === 0) return []
  const chunks: string[] = []
  let start = 0
  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length)
    const chunk = words.slice(start, end).join(' ')
    if (chunk.trim().length > 30) chunks.push(chunk)
    if (end >= words.length) break
    start = end - overlap
  }
  return chunks
}
