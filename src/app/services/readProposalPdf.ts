import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import {
  COLUMN_SEPARATOR,
  nameFromFileName,
  parseProposalText,
  type ParsedProposal,
} from '../../utils/proposalParser';

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PAGES = 10;
/** Espaço horizontal (em pt) a partir do qual dois trechos são colunas diferentes. */
const COLUMN_GAP = 14;

type TextPiece = Pick<TextItem, 'str' | 'transform' | 'width'>;

/**
 * Agrupa os trechos de texto de uma página em linhas, pela posição vertical.
 * Trechos da mesma linha muito afastados (colunas, células de tabela) são
 * separados por COLUMN_SEPARATOR.
 */
function toLines(items: TextPiece[]): string[] {
  const rows = new Map<number, TextPiece[]>();
  for (const item of items) {
    if (!item.str.trim()) continue;
    const y = Math.round(item.transform[5] / 3); // tolerância de ~3pt
    rows.set(y, [...(rows.get(y) ?? []), item]);
  }

  return [...rows.entries()]
    .sort(([a], [b]) => b - a) // de cima para baixo
    .map(([, row]) => {
      row.sort((a, b) => a.transform[4] - b.transform[4]);
      let line = row[0].str;
      for (let i = 1; i < row.length; i += 1) {
        const gap = row[i].transform[4] - (row[i - 1].transform[4] + row[i - 1].width);
        // Colados (gap ~0): letras acentuadas que alguns PDFs gravam como trechos à parte ("INSTALA" + "ÇÃ" + "O").
        line += (gap > COLUMN_GAP ? COLUMN_SEPARATOR : gap > 1 ? ' ' : '') + row[i].str;
      }
      return line;
    });
}

/**
 * Lê o PDF de uma proposta no próprio navegador (pdf.js) e extrai cliente,
 * WhatsApp e valor por regras. Nenhum dado sai do computador do usuário.
 */
export async function readProposalPdf(file: File): Promise<ParsedProposal> {
  if (file.size > MAX_PDF_BYTES) throw new Error('O PDF passa de 10 MB.');

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') {
    throw new Error('O arquivo escolhido não é um PDF.');
  }

  // Carregado sob demanda: a pdf.js é grande e só é usada aqui.
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data: bytes }).promise;
  } catch {
    throw new Error('Não consegui abrir este PDF (ele pode estar protegido por senha ou corrompido).');
  }

  const lines: string[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, MAX_PAGES); pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      lines.push(...toLines(content.items.filter((item): item is TextItem => 'str' in item)));
    }
  } finally {
    void pdf.destroy();
  }

  if (lines.join('').replace(/\s/g, '').length < 20) {
    throw new Error('Este PDF não tem texto (parece uma imagem escaneada). Preencha manualmente.');
  }

  const parsed = parseProposalText(lines);
  return { ...parsed, clientName: parsed.clientName ?? nameFromFileName(file.name) };
}
