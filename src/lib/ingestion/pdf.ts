import { chunkText } from './chunker'

export async function extractPdfText(buffer: Buffer): Promise<string[]> {
  // Use internal path to bypass pdf-parse test runner (avoids ENOENT error in serverless)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js')
  const { text } = await pdfParse(buffer)
  return chunkText(text)
}
