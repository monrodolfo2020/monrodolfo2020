import { chunkText } from './chunker'

// Polyfill DOMMatrix for serverless environments (required by pdf-parse v2)
if (typeof globalThis.DOMMatrix === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).DOMMatrix = class DOMMatrix {
    a=1;b=0;c=0;d=1;e=0;f=0
    m11=1;m12=0;m13=0;m14=0;m21=0;m22=1;m23=0;m24=0
    m31=0;m32=0;m33=1;m34=0;m41=0;m42=0;m43=0;m44=1
    is2D=true;isIdentity=true
    constructor(_init?: string | number[]) {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromMatrix() { return new (globalThis as any).DOMMatrix() }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromFloat32Array() { return new (globalThis as any).DOMMatrix() }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromFloat64Array() { return new (globalThis as any).DOMMatrix() }
    multiply() { return this }
    translate() { return this }
    scale() { return this }
    rotate() { return this }
    invertSelf() { return this }
    transformPoint() { return { x: 0, y: 0, z: 0, w: 1 } }
    toFloat32Array() { return new Float32Array(16) }
    toFloat64Array() { return new Float64Array(16) }
  }
}

export async function extractPdfText(buffer: Buffer): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  const { text } = await pdfParse(buffer)
  return chunkText(text)
}
