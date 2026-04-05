import { chunkText } from './chunker'

export async function scrapeUrl(url: string): Promise<string[]> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AgentForgeBot/1.0)' },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`No se pudo acceder a la página: ${response.status}`)

  const html = await response.text()
  const { load } = await import('cheerio')
  const $ = load(html)

  $('script, style, nav, footer, header, .nav, .footer, .header, .menu, .sidebar, .ad, .advertisement').remove()

  const title = $('title').text() || $('h1').first().text() || url
  const body = $('main, article, .content, #content, body').first().text() ||
               $('body').text()

  const cleaned = body.replace(/\s+/g, ' ').trim()
  return chunkText(`${title}\n\n${cleaned}`)
}
