'use client';

import { companyAddressLines, type CompanyProfile } from '@/lib/company-profile';
import { formatPeriodLine, type StatementPeriod } from '@/lib/period';
import {
  cellFlatText,
  cellIsNumeric,
  cellText,
  isRichCell,
  numericColumns,
  type Cell,
  type CellTone,
} from '@/lib/export-cells';

/* ------------------------------------------------------------------ *
 *  Shared export / print template.
 *
 *  Every Excel, PDF and Print export in the console (account-head ledgers,
 *  voucher register, cash book, passenger/pilgrim lists, statements …) goes
 *  through here, so they all carry the SAME letterhead:
 *
 *    [logo]  Company name                              Title
 *            Head Office / Branch Office / Mobile      Printed on: <date>
 *            ------------------------------------------<n> records-------
 *            <table … totals line>
 *            Prepared by: ______        Authorized Signature
 *
 *  The title block sits top-right beside the letterhead (not under it), so
 *  the table starts higher on the page. Cells may be `RichCell`s (bold /
 *  coloured / with a note) — see lib/export-cells.ts — and an optional
 *  `foot` row prints as the totals line with a rule above it.
 *  plus the company logo as a centred ~15 % watermark on every printed page.
 * ------------------------------------------------------------------ */

export type ExportPeriod = StatementPeriod;

export type ExportMeta = {
  /** Letterhead. When omitted the export prints without a company block. */
  company?: CompanyProfile | null;
  /** "Statement for the period" line. Omit for plain lists ("Printed on" is shown instead). */
  period?: ExportPeriod | null;
  locale?: 'en' | 'bn';
  /** Optional name printed after "Prepared by:" (blank line when empty). */
  preparedBy?: string | null;
  /** Totals line under the table (one cell per header; see buildTotalsRow). */
  foot?: Cell[] | null;
};

const LABELS = {
  en: {
    head: 'Head Office',
    branch: 'Branch Office',
    mobile: 'Mobile',
    email: 'Email',
    preparedBy: 'Prepared by',
    authorized: 'Authorized Signature',
    page: 'Page',
  },
  bn: {
    head: 'প্রধান কার্যালয়',
    branch: 'শাখা কার্যালয়',
    mobile: 'মোবাইল',
    email: 'ইমেইল',
    preparedBy: 'প্রস্তুতকারী',
    authorized: 'অনুমোদিত স্বাক্ষর',
    page: 'পৃষ্ঠা',
  },
} as const;

type Labels = (typeof LABELS)['en'] | (typeof LABELS)['bn'];

const periodLine = formatPeriodLine;

function letterheadLines(company: CompanyProfile, L: Labels): string[] {
  return companyAddressLines(company, { head: L.head, branch: L.branch, mobile: L.mobile, email: L.email });
}

/** Colours shared by the HTML print and the PDF (RGB) for RichCell tones. */
const TONE_HEX: Record<CellTone, string> = {
  brand: '#0a6248',
  amber: '#b45309',
  red: '#dc2626',
  muted: '#6b7280',
};
const TONE_RGB: Record<CellTone, [number, number, number]> = {
  brand: [10, 98, 72],
  amber: [180, 83, 9],
  red: [220, 38, 38],
  muted: [107, 114, 128],
};

/* ------------------------------------------------------------------ *
 *  Excel
 * ------------------------------------------------------------------ */

/** Export rows to a real .xlsx file (SheetJS, loaded on demand). */
export async function exportToExcel(
  filename: string,
  headers: string[],
  rows: Cell[][],
  meta: ExportMeta & { title?: string; subtitle?: string } = {},
) {
  const XLSX = await import('xlsx');
  const locale = meta.locale ?? 'en';
  const L = LABELS[locale];
  const company = meta.company ?? null;
  const cols = Math.max(headers.length, 2);

  const top: Cell[][] = [];
  if (company) {
    top.push([company.name]);
    if (company.license) top.push([company.license]);
    for (const line of letterheadLines(company, L)) top.push([line]);
    top.push([]);
  }
  if (meta.title) top.push([meta.title]);
  top.push([periodLine(meta.period, locale)]);
  if (meta.subtitle) top.push([meta.subtitle]);
  top.push([]);

  const tail: Cell[][] = [
    [],
    [`${L.preparedBy}: ${meta.preparedBy || company?.preparedByName || ''}`],
    [`${L.authorized}: ${company?.authorizedName || ''}`],
  ];

  const flat = (r: Cell[]) => r.map((c) => (isRichCell(c) ? cellFlatText(c) : c ?? ''));
  const body = rows.map(flat);
  if (meta.foot) body.push(flat(meta.foot));

  const aoa = [...top.map(flat), headers, ...body, ...tail.map(flat)];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Letterhead / title rows span the whole table width.
  const merges = top
    .map((r, i) => (r.length === 1 ? { s: { r: i, c: 0 }, e: { r: i, c: cols - 1 } } : null))
    .filter(Boolean) as { s: { r: number; c: number }; e: { r: number; c: number } }[];
  ws['!merges'] = merges;
  ws['!cols'] = headers.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/* ------------------------------------------------------------------ *
 *  PDF
 * ------------------------------------------------------------------ */

type LogoBitmap = { dataUrl: string; stamp: string; w: number; h: number };

/** Longest logo edge embedded in the PDF — plenty for print, tiny on disk. */
const PDF_LOGO_MAX_PX = 640;

/**
 * Load the logo into data URLs jsPDF can embed: the original (on white) for
 * the letterhead and a uniform grey "stamp" for the watermark (light logo
 * parts would otherwise vanish against the white page). Both are downscaled
 * and JPEG-encoded so a multi-page ledger stays a few hundred KB, not MBs.
 */
async function loadLogo(src: string): Promise<LogoBitmap | null> {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null;
    const url = new URL(src, window.location.origin).href;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('logo failed to load'));
      img.src = url;
    });
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return null;
    const scale = Math.min(1, PDF_LOGO_MAX_PX / Math.max(nw, nh));
    const w = Math.max(1, Math.round(nw * scale));
    const h = Math.max(1, Math.round(nh * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // Flatten onto white: the page is white anyway and JPEG has no alpha.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    // Grey stamp variant for the watermark (white stays white → invisible at 15 %).
    const px = ctx.getImageData(0, 0, w, h);
    const d = px.data;
    for (let i = 0; i < d.length; i += 4) {
      const grey = 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
      // Darken the artwork, keep near-white background white.
      const v = grey > 245 ? 255 : grey * 0.45;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(px, 0, 0);
    const stamp = canvas.toDataURL('image/jpeg', 0.85);
    return { dataUrl, stamp, w, h };
  } catch {
    return null;
  }
}

type PngBitmap = { dataUrl: string; w: number; h: number };

/** Load a transparent PNG (signature) as a PNG data URL jsPDF keeps the alpha of. */
async function loadPng(src: string): Promise<PngBitmap | null> {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('image failed to load'));
      img.src = new URL(src, window.location.origin).href;
    });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return null;
    const scale = Math.min(1, 800 / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL('image/png'), w: canvas.width, h: canvas.height };
  } catch {
    return null;
  }
}

/**
 * jsPDF's built-in Helvetica has no Taka glyph — "৳" comes out as a stray
 * accented letter and switches the whole line to spaced-out rendering.
 * Spell it "Tk" in PDFs instead.
 */
function pdfText(s: string): string {
  return s.replace(/৳\s?/g, 'Tk ');
}

/** Cell text for the PDF: the value, with a rich note on its own line. */
function pdfCellText(c: Cell): string {
  const text = pdfText(cellText(c));
  if (isRichCell(c) && c.note) return text ? `${text}\n${pdfText(c.note)}` : pdfText(c.note);
  return text;
}

export type PdfOptions = {
  filename: string;
  title: string;
  subtitle?: string;
  headers: string[];
  rows: Cell[][];
  orientation?: 'p' | 'l';
} & ExportMeta;

/**
 * Build the jsPDF document (letterhead, title block, table, totals, signatures).
 * Separated from exportToPDF so it can be rendered headlessly (tests / previews).
 */
export async function buildPdfDocument(opts: PdfOptions) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  // jsPDF's built-in fonts have no Bangla glyphs, so the fixed labels stay
  // English in the PDF (the HTML print is fully localized).
  const L = LABELS.en;
  const company = opts.company ?? null;
  const [logo, prepSig, authSig] = await Promise.all([
    company?.logo ? loadLogo(company.logo) : null,
    company?.preparedBySignature ? loadPng(company.preparedBySignature) : null,
    company?.authorizedSignature ? loadPng(company.authorizedSignature) : null,
  ]);

  const doc = new jsPDF({ orientation: opts.orientation ?? 'p', unit: 'mm', format: 'a4', compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 14;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDoc = doc as any;
  const drawWatermark = () => {
    if (!logo) return;
    try {
      const targetW = Math.min(pageW, pageH) * 0.55;
      const targetH = (targetW * logo.h) / logo.w;
      anyDoc.saveGraphicsState();
      anyDoc.setGState(new anyDoc.GState({ opacity: 0.15 }));
      doc.addImage(logo.stamp, 'JPEG', (pageW - targetW) / 2, (pageH - targetH) / 2, targetW, targetH, 'wm-logo');
      anyDoc.restoreGraphicsState();
    } catch {
      // watermark is decorative — never block the export
    }
  };

  drawWatermark();

  // ---- Letterhead (left) + title block (right) ----------------------------
  const y = 12;
  let textX = M;
  if (logo) {
    const lh = 22;
    const lw = (lh * logo.w) / logo.h;
    doc.addImage(logo.dataUrl, 'JPEG', M, y - 2, lw, lh, 'lh-logo');
    textX = M + lw + 5;
  }
  // The title block takes the right ~36 % of the page when a letterhead is
  // printed; the company lines wrap inside what is left.
  const rightW = company ? pageW * 0.36 : 0;
  const maxW = pageW - textX - M - (company ? rightW + 6 : 0);
  let ly = y + 3;
  if (company) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(6, 64, 43);
    doc.text(pdfText(company.name), textX, ly, { maxWidth: maxW });
    ly += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(70);
    if (company.license) {
      doc.text(pdfText(company.license), textX, ly, { maxWidth: maxW });
      ly += 4;
    }
    for (const line of letterheadLines(company, L)) {
      const wrapped = doc.splitTextToSize(pdfText(line), maxW) as string[];
      doc.text(wrapped, textX, ly);
      ly += 4 * wrapped.length;
    }
  }

  // Title / printed-on / record count — right-aligned beside the letterhead.
  const drawTitleBlock = (x: number, startY: number, width: number, align: 'left' | 'right') => {
    let ty = startY;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20);
    const titleLines = doc.splitTextToSize(pdfText(opts.title), width) as string[];
    doc.text(titleLines, x, ty, { align });
    ty += 5.5 * titleLines.length;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(6, 64, 43);
    doc.text(periodLine(opts.period, 'en'), x, ty, { align });
    ty += 4.5;
    if (opts.subtitle) {
      doc.setTextColor(110);
      const sub = doc.splitTextToSize(pdfText(opts.subtitle), width) as string[];
      doc.text(sub, x, ty, { align });
      ty += 4.5 * sub.length;
    }
    return ty;
  };

  let tableStart: number;
  if (company) {
    const ry = drawTitleBlock(pageW - M, y + 4, rightW, 'right');
    const headerBottom = Math.max(ly, ry, logo ? y + 22 : 0) + 1;
    doc.setDrawColor(14, 124, 90);
    doc.setLineWidth(0.6);
    doc.line(M, headerBottom, pageW - M, headerBottom);
    tableStart = headerBottom + 5;
  } else {
    tableStart = drawTitleBlock(M, y + 4, pageW - 2 * M, 'left') + 2;
  }

  // ---- Table --------------------------------------------------------------
  const rows = opts.rows;
  const foot = opts.foot ?? null;
  // Money / count columns are right-aligned as a whole (header, cells, totals).
  const numCols = numericColumns(opts.headers, foot ? [...rows, foot] : rows);
  autoTable(doc, {
    head: [opts.headers.map(pdfText)],
    body: rows.map((r) => r.map(pdfCellText)),
    foot: foot ? [foot.map(pdfCellText)] : undefined,
    showFoot: 'lastPage',
    startY: tableStart,
    margin: { left: M, right: M, top: 14, bottom: 16 },
    styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
    headStyles: { fillColor: [14, 124, 90], textColor: 255 },
    footStyles: { fillColor: [241, 239, 230], textColor: 20, fontStyle: 'bold', fontSize: 8.5 },
    alternateRowStyles: { fillColor: [246, 243, 234] },
    didParseCell: (data) => {
      // Whole numeric columns right-aligned (head, body and foot alike).
      if (numCols[data.column.index]) data.cell.styles.halign = 'right';
      // RichCell bold + tone.
      const src =
        data.section === 'body'
          ? rows[data.row.index]?.[data.column.index]
          : data.section === 'foot'
            ? foot?.[data.column.index]
            : undefined;
      if (src === undefined) return;
      if (isRichCell(src)) {
        if (src.bold) data.cell.styles.fontStyle = 'bold';
        if (src.tone) data.cell.styles.textColor = TONE_RGB[src.tone];
      }
    },
    didDrawCell: (data) => {
      // A rule above the totals line so it reads as the sum of the column.
      if (data.section === 'foot' && data.row.index === 0) {
        doc.setDrawColor(10, 20, 16);
        doc.setLineWidth(0.5);
        doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
      }
    },
    willDrawPage: (data) => {
      if (data.pageNumber > 1) drawWatermark();
    },
    didDrawPage: (data) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140);
      doc.text(pdfText(`${company?.name ?? ''}${company ? ' - ' : ''}${L.page} ${data.pageNumber}`), M, pageH - 7);
    },
  });

  // ---- Signatures: two identical blocks, image above the line, name + label under it
  const sigW = 55;
  const imgH = 14;
  let fy = (anyDoc.lastAutoTable?.finalY ?? tableStart) + 12 + imgH;
  if (fy > pageH - 26) {
    doc.addPage();
    drawWatermark();
    fy = 30 + imgH;
  }
  const drawSignature = (x: number, img: PngBitmap | null, name: string | undefined, label: string) => {
    if (img) {
      const w = Math.min(sigW, (imgH * img.w) / img.h);
      const h = (w * img.h) / img.w;
      try {
        doc.addImage(img.dataUrl, 'PNG', x + (sigW - w) / 2, fy - 1.5 - h, w, h);
      } catch {
        // a broken image never blocks the export
      }
    }
    doc.setDrawColor(90);
    doc.setLineWidth(0.3);
    doc.line(x, fy, x + sigW, fy);
    let ty = fy + 4;
    if (name) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(20);
      doc.text(pdfText(name), x + sigW / 2, ty, { align: 'center', maxWidth: sigW });
      ty += 4;
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text(label, x + sigW / 2, ty, { align: 'center' });
  };
  drawSignature(M, prepSig, opts.preparedBy || company?.preparedByName || undefined, L.preparedBy);
  drawSignature(pageW - M - sigW, authSig, company?.authorizedName || undefined, L.authorized);

  return doc;
}

/** Export a titled table to PDF (jsPDF + autotable, loaded on demand). */
export async function exportToPDF(opts: PdfOptions) {
  const doc = await buildPdfDocument(opts);
  doc.save(opts.filename.endsWith('.pdf') ? opts.filename : `${opts.filename}.pdf`);
}

/* ------------------------------------------------------------------ *
 *  Print (HTML window)
 * ------------------------------------------------------------------ */

function absoluteUrl(src: string): string {
  try {
    return typeof window !== 'undefined' ? new URL(src, window.location.origin).href : src;
  } catch {
    return src;
  }
}

/**
 * Letterhead block as HTML (shared by print and on-page previews). With a
 * `titleBlock` the title / period / subtitle are set top-right beside the
 * company details so the table starts higher on the page.
 */
export function letterheadHtml(
  company: CompanyProfile | null | undefined,
  locale: 'en' | 'bn' = 'en',
  titleBlock?: { title: string; period: string; subtitle?: string },
): string {
  const titleHtml = titleBlock
    ? `<div class="lh-title">
        <h2>${escapeHtml(titleBlock.title)}</h2>
        <p class="period">${escapeHtml(titleBlock.period)}</p>
        ${titleBlock.subtitle ? `<p class="sub">${escapeHtml(titleBlock.subtitle)}</p>` : ''}
      </div>`
    : '';
  if (!company) return titleHtml ? `<div class="lh lh-plain">${titleHtml}</div>` : '';
  const L = LABELS[locale];
  const logo = company.logo ? absoluteUrl(company.logo) : '';
  const lines = letterheadLines(company, L)
    .map((l) => `<p>${escapeHtml(l)}</p>`)
    .join('');
  return `<div class="lh">
      ${logo ? `<img src="${escapeHtml(logo)}" alt="">` : ''}
      <div class="lh-co">
        <h1>${escapeHtml(company.name)}</h1>
        ${company.license ? `<p class="lic">${escapeHtml(company.license)}</p>` : ''}
        ${lines}
      </div>
      ${titleHtml}
    </div>`;
}

/** One signature block of the print footer: image above the line, name + label under it. */
function signatureBlockHtml(image: string | null | undefined, name: string | null | undefined, label: string): string {
  const img = image ? `<img src="${escapeHtml(absoluteUrl(image))}" alt="">` : '';
  return `<div class="blk"><div class="img">${img}</div><div class="line">${
    name ? `<p class="name">${escapeHtml(name)}</p>` : ''
  }<p class="lbl">${escapeHtml(label)}</p></div></div>`;
}

/**
 * One <td>: `numCol` right-aligns the whole column (so text in a money column
 * sits flush with the figures), `n` marks a genuinely numeric cell (no wrap,
 * tabular figures).
 */
function printCellHtml(c: Cell, numCol = false): string {
  const text = cellText(c);
  const cls = [numCol ? 'num' : '', cellIsNumeric(c) ? 'n' : ''].filter(Boolean).join(' ');
  let inner = escapeHtml(text);
  if (isRichCell(c)) {
    const spanCls = [c.bold ? 'bold' : '', c.tone ? `tone-${c.tone}` : ''].filter(Boolean).join(' ');
    inner = spanCls ? `<span class="${spanCls}">${inner}</span>` : inner;
    if (c.note) inner += `<span class="note">${escapeHtml(c.note)}</span>`;
  }
  return `<td${cls ? ` class="${cls}"` : ''}>${inner}</td>`;
}

export type PrintOptions = {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: Cell[][];
} & ExportMeta;

/** The complete print document as HTML (used by printTable; renderable headlessly). */
export function buildPrintHtml(opts: PrintOptions): string {
  const locale = opts.locale ?? 'en';
  const L = LABELS[locale];
  const company = opts.company ?? null;
  const logo = company?.logo ? absoluteUrl(company.logo) : '';

  // Money / count columns are right-aligned as a whole (header, cells, totals).
  const numCols = numericColumns(opts.headers, opts.foot ? [...opts.rows, opts.foot] : opts.rows);
  const head = opts.headers.map((h, i) => `<th${numCols[i] ? ' class="num"' : ''}>${escapeHtml(h)}</th>`).join('');
  const body = opts.rows.map((r) => `<tr>${r.map((c, i) => printCellHtml(c, numCols[i])).join('')}</tr>`).join('');
  // The totals line lives in <tbody> (not <tfoot>) so browsers print it once,
  // at the very end, instead of repeating it on every page.
  const foot = opts.foot ? `<tr class="total">${opts.foot.map((c, i) => printCellHtml(c, numCols[i])).join('')}</tr>` : '';

  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>${escapeHtml(opts.title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      *{font-family:Arial,Helvetica,'Noto Sans Bengali',sans-serif;box-sizing:border-box}
      body{margin:0;padding:22px 28px;color:#0a1410;background:#fff}
      .wm{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:58%;max-height:68%;object-fit:contain;opacity:.16;filter:grayscale(1) brightness(.45);pointer-events:none;z-index:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .content{position:relative;z-index:1}
      .lh{display:flex;gap:16px;align-items:flex-start;border-bottom:2px solid #0e7c5a;padding-bottom:10px;margin-bottom:12px}
      .lh img{width:78px;height:78px;object-fit:contain;flex:none}
      .lh-co{flex:1 1 auto;min-width:0}
      .lh h1{font-size:21px;margin:0;color:#06402b;line-height:1.15}
      .lh .lic{font-size:11px;font-weight:600;color:#555;margin:2px 0 4px}
      .lh p{margin:1px 0;font-size:11px;color:#333}
      .lh-title{flex:0 1 38%;margin-left:auto;text-align:right;padding-left:12px}
      .lh-plain .lh-title{margin-left:0;text-align:left;padding-left:0;flex:1 1 auto}
      .lh-title h2{font-size:15px;font-weight:700;margin:2px 0 3px;color:#0a1410;line-height:1.2}
      .lh-title p.period{font-size:11.5px;font-weight:600;color:#06402b;margin:0 0 2px}
      .lh-title p.sub{font-size:11px;color:#555;margin:0}
      table{width:100%;border-collapse:collapse;font-size:11px;background:transparent}
      thead{display:table-header-group}
      tr{page-break-inside:avoid}
      th,td{border:1px solid #cfd8d3;padding:5px 7px;text-align:left;vertical-align:middle}
      th{background:#0e7c5a;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      th.num,td.num{text-align:right}
      td.n{white-space:nowrap;font-variant-numeric:tabular-nums}
      tbody tr:nth-child(even) td{background:rgba(246,243,234,.7)}
      tbody tr.total td{border-top:3px double #0a1410;border-bottom:2px solid #0a1410;background:#f1efe6;font-weight:700;font-size:11.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .bold{font-weight:700}
      .tone-brand{color:${TONE_HEX.brand}}.tone-amber{color:${TONE_HEX.amber}}.tone-red{color:${TONE_HEX.red}}.tone-muted{color:${TONE_HEX.muted}}
      .note{display:block;font-size:9.5px;color:#666;margin-top:1px;font-weight:400}
      .sig{display:flex;justify-content:space-between;align-items:flex-end;gap:32px;margin-top:40px;page-break-inside:avoid}
      .sig .blk{width:220px;max-width:45%;text-align:center}
      .sig .img{height:64px;display:flex;align-items:flex-end;justify-content:center}
      .sig .img img{max-height:64px;max-width:100%;object-fit:contain}
      .sig .line{border-top:1px solid #444;padding-top:4px}
      .sig .name{font-size:11.5px;font-weight:700;margin:0;color:#0a1410}
      .sig .lbl{font-size:10.5px;color:#555;margin:0}
      @page{margin:12mm}
      @media print{.noprint{display:none}}
    </style></head><body>
      ${logo ? `<img class="wm" src="${escapeHtml(logo)}" alt="">` : ''}
      <div class="content">
        ${letterheadHtml(company, locale, { title: opts.title, period: periodLine(opts.period, locale), subtitle: opts.subtitle })}
        <table><thead><tr>${head}</tr></thead><tbody>${body}${foot}</tbody></table>
        <div class="sig">
          ${signatureBlockHtml(company?.preparedBySignature, opts.preparedBy || company?.preparedByName, L.preparedBy)}
          ${signatureBlockHtml(company?.authorizedSignature, company?.authorizedName, L.authorized)}
        </div>
      </div>
      <script>
        // Print once the Bangla web font is in (or after a short grace period).
        window.onload=function(){var go=function(){setTimeout(function(){window.print()},150)};
          if(document.fonts&&document.fonts.ready){Promise.race([document.fonts.ready,new Promise(function(r){setTimeout(r,1500)})]).then(go,go)}else{go()}};
      </script>
    </body></html>`;
}

/** Open a clean print window for a titled table (list print / ledger print). */
export function printTable(opts: PrintOptions) {
  const w = window.open('', '_blank', 'width=1000,height=700');
  if (!w) return;
  w.document.write(buildPrintHtml(opts));
  w.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
