import { dataUrlToBlob } from './googleDriveSync';

export interface DocxExtractedContent {
  kind: 'docx-blocks' | 'html' | 'text' | 'unsupported';
  blocks?: Array<{ type: 'paragraph' | 'table'; text?: string; rows?: string[][] }>;
  html?: string;
  text?: string;
  reason?: string;
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

async function inflateRawBytes(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('Browser tidak mendukung DecompressionStream untuk pratinjau DOCX lokal.');
  }
  const stream = new Blob([compressed as unknown as BlobPart]).stream().pipeThrough(
    new DecompressionStream('deflate-raw')
  );
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Mengekstrak file tertentu (misal word/document.xml) dari buffer ZIP (.docx)
 * membaca dari Central Directory agar kompatibel dengan data descriptor Word/Google Docs.
 */
export async function extractZipEntryBytes(
  zipBytes: Uint8Array,
  targetPath: string
): Promise<Uint8Array | null> {
  // Cari End of Central Directory signature 0x06054b50 dari akhir buffer
  const minOffset = Math.max(0, zipBytes.length - 65557);
  let eocdOffset = -1;
  for (let i = zipBytes.length - 22; i >= minOffset; i--) {
    if (
      zipBytes[i] === 0x50 &&
      zipBytes[i + 1] === 0x4b &&
      zipBytes[i + 2] === 0x05 &&
      zipBytes[i + 3] === 0x06
    ) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) return null;

  const totalEntries = readUint16LE(zipBytes, eocdOffset + 10);
  const cdOffset = readUint32LE(zipBytes, eocdOffset + 16);
  const decoder = new TextDecoder('utf-8');

  let cursor = cdOffset;
  for (let idx = 0; idx < totalEntries; idx++) {
    if (cursor + 46 > zipBytes.length) break;
    const sig = readUint32LE(zipBytes, cursor);
    if (sig !== 0x02014b50) break;

    const method = readUint16LE(zipBytes, cursor + 10);
    const compressedSize = readUint32LE(zipBytes, cursor + 20);
    const fileNameLen = readUint16LE(zipBytes, cursor + 28);
    const extraLen = readUint16LE(zipBytes, cursor + 30);
    const commentLen = readUint16LE(zipBytes, cursor + 32);
    const localHeaderOffset = readUint32LE(zipBytes, cursor + 42);

    const fileName = decoder.decode(zipBytes.slice(cursor + 46, cursor + 46 + fileNameLen));
    cursor += 46 + fileNameLen + extraLen + commentLen;

    if (fileName === targetPath) {
      const localSig = readUint32LE(zipBytes, localHeaderOffset);
      if (localSig !== 0x04034b50) return null;
      const localNameLen = readUint16LE(zipBytes, localHeaderOffset + 26);
      const localExtraLen = readUint16LE(zipBytes, localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compressedSlice = zipBytes.slice(dataStart, dataStart + compressedSize);

      if (method === 0) {
        return compressedSlice;
      }
      if (method === 8) {
        return await inflateRawBytes(compressedSlice);
      }
      return null;
    }
  }

  return null;
}

export function parseWordDocumentXml(
  xmlString: string
): Array<{ type: 'paragraph' | 'table'; text?: string; rows?: string[][] }> {
  const blocks: Array<{ type: 'paragraph' | 'table'; text?: string; rows?: string[][] }> = [];

  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const body = doc.getElementsByTagNameNS('*', 'body')[0] || doc.documentElement;
    if (body) {
      const extractParaText = (pNode: Element): string => {
        const parts: string[] = [];
        const walk = (node: Node) => {
          if (node.nodeType === 1) {
            const el = node as Element;
            const local = el.localName || el.nodeName.split(':').pop();
            if (local === 't' || local === 'delText') {
              parts.push(el.textContent || '');
              return;
            }
            if (local === 'tab') {
              parts.push('    ');
              return;
            }
            if (local === 'br' || local === 'cr') {
              parts.push('\n');
              return;
            }
          }
          for (let i = 0; i < node.childNodes.length; i++) {
            walk(node.childNodes[i]);
          }
        };
        walk(pNode);
        return parts.join('').replace(/\u00a0/g, ' ').trimRight();
      };

      for (let i = 0; i < body.childNodes.length; i++) {
        const child = body.childNodes[i];
        if (child.nodeType !== 1) continue;
        const el = child as Element;
        const local = el.localName || el.nodeName.split(':').pop();
        if (local === 'p') {
          const text = extractParaText(el);
          blocks.push({ type: 'paragraph', text });
        } else if (local === 'tbl') {
          const rows: string[][] = [];
          const trList = el.getElementsByTagNameNS('*', 'tr');
          for (let r = 0; r < trList.length; r++) {
            const tr = trList[r];
            const rowCells: string[] = [];
            const tcList = tr.getElementsByTagNameNS('*', 'tc');
            for (let c = 0; c < tcList.length; c++) {
              const tc = tcList[c];
              const pList = tc.getElementsByTagNameNS('*', 'p');
              const cellTexts: string[] = [];
              for (let p = 0; p < pList.length; p++) {
                const pt = extractParaText(pList[p]).trim();
                if (pt) cellTexts.push(pt);
              }
              rowCells.push(cellTexts.join('\n'));
            }
            if (rowCells.length > 0) rows.push(rowCells);
          }
          if (rows.length > 0) blocks.push({ type: 'table', rows });
        }
      }
      return blocks;
    }
  }

  // Fallback regex parser (misalnya untuk environment non-DOM/Node tests)
  const paraMatches = xmlString.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
  paraMatches.forEach((pXml) => {
    const tMatches = pXml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
    const text = tMatches
      .map((t) => t.replace(/<[^>]+>/g, ''))
      .join('')
      .trim();
    if (text) blocks.push({ type: 'paragraph', text });
  });
  return blocks;
}

export async function extractDocumentPreviewFromDataUrl(
  dataUrl: string,
  fileName: string
): Promise<DocxExtractedContent> {
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) {
    return { kind: 'unsupported', reason: 'Format data berkas tidak valid.' };
  }

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const lowerName = (fileName || '').toLowerCase();

  // Cek apakah file berupa ZIP (.docx) berdasar magic bytes PK\x03\x04
  const isZip =
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04;

  if (isZip || lowerName.endsWith('.docx')) {
    try {
      const xmlBytes = await extractZipEntryBytes(bytes, 'word/document.xml');
      if (xmlBytes) {
        const xmlText = new TextDecoder('utf-8').decode(xmlBytes);
        const blocks = parseWordDocumentXml(xmlText);
        return { kind: 'docx-blocks', blocks };
      }
    } catch (err: any) {
      return {
        kind: 'unsupported',
        reason: err?.message || 'Gagal membaca isi berkas DOCX.',
      };
    }
  }

  // Cek apakah berupa HTML-based .doc / .html / .txt
  const sampleText = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 4096));
  if (
    lowerName.endsWith('.html') ||
    lowerName.endsWith('.htm') ||
    sampleText.includes('<html') ||
    sampleText.includes('<HTML') ||
    sampleText.includes('<!DOCTYPE')
  ) {
    const fullHtml = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return { kind: 'html', html: fullHtml };
  }

  if (lowerName.endsWith('.txt') || lowerName.endsWith('.csv') || lowerName.endsWith('.json')) {
    const fullText = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return { kind: 'text', text: fullText };
  }

  return {
    kind: 'unsupported',
    reason: 'Format biner ini tidak dapat dirender langsung di browser secara offline. Gunakan tombol Buka di Tab Baru (Google Drive) atau Unduh.',
  };
}
