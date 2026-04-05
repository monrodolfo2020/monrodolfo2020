import { chunkText } from './chunker'

export async function extractPdfText(buffer: Buffer): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  const { text } = await pdfParse(buffer)
  return chunkText(text)
}
