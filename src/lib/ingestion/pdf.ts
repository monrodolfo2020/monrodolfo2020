import { chunkText } from './chunker'

export async function extractPdfText(buffer: Buffer): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('PDF parsing timed out after 25s'))
    }, 25000)

    try {
      // Use internal lib path to avoid test file lookup (ENOENT fix)
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse/lib/pdf-parse.js')
      pdfParse(buffer)
        .then((data: { text: string }) => {
          clearTimeout(timeout)
          resolve(chunkText(data.text))
        })
        .catch((err: Error) => {
          clearTimeout(timeout)
          reject(err)
        })
    } catch (err) {
      clearTimeout(timeout)
      reject(err as Error)
    }
  })
}
