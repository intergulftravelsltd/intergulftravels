'use client';

import { companyAddressLines, type CompanyProfile } from '@/lib/company-profile';
import { formatPeriodLine, type StatementPeriod } from '@/lib/period';

/* ------------------------------------------------------------------ *
 *  Shared export / print template.
 *
 *  Every Excel, PDF and Print export in the console (account-head ledgers,
 *  voucher register, cash book, passenger/pilgrim lists, statements …) goes
 *  through here, so they all carry the SAME letterhead:
 *
 *    [logo]  Company name                       ← the signed-in agency
 *            Head Office / Branch Office / Mobile / Email
 *            ------------------------------------------------
 *            Title
 *            Statement for the period: <start> to <end>
 *            <table>
 *            Prepared by: ______        Authorized Signature
 *
 *  plus the company logo as a centred ~15 % watermark on every printed page.
 * ------------------------------------------------------------------ */

type Cell = string | number | null | undefined;

export type ExportPeriod = StatementPeriod;

export type ExportMeta = {
  /** Letterhead. When omitted the export prints without a company block. */
  company?: CompanyProfile | null;
  /** "Statement for the period" line. Omit for plain lists ("Printed on" is shown instead). */
  period?: ExportPeriod | null;
  locale?: 'en' | 'bn';
  /** Optional name printed after "Prepared by:" (blank line when empty). */
  preparedBy?: string | null;
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

const cellText = (c: Cell) => (c == null ? '' : String(c));

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
    [`${L.preparedBy}: ${meta.preparedBy ?? ''}`],
    [`${L.authorized}:`],
  ];

  const aoa = [...top, headers, ...rows.map((r) => r.map((c) => c ?? '')), ...tail];
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

/**
 * jsPDF's built-in Helvetica has no Taka glyph — "৳" comes out as a stray
 * accented letter and switches the whole line to spaced-out rendering.
 * Spell it "Tk" in PDFs instead.
 */
function pdfText(s: string): string {
  return s.replace(/৳\s?/g, 'Tk ');
}

/** Export a titled table to PDF (jsPDF + autotable, loaded on demand). */
export async function exportToPDF(
  opts: {
    filename: string;
    title: string;
    subtitle?: string;
    headers: string[];
    rows: Cell[][];
    orientation?: 'p' | 'l';
  } & ExportMeta,
) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  // jsPDF's built-in fonts have no Bangla glyphs, so the fixed labels stay
  // English in the PDF (the HTML print is fully localized).
  const L = LABELS.en;
  const company = opts.company ?? null;
  const logo = company?.logo ? await loadLogo(company.logo) : null;

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

  // ---- Letterhead ---------------------------------------------------------
  let y = 12;
  let textX = M;
  if (logo) {
    const lh = 22;
    const lw = (lh * logo.w) / logo.h;
    doc.addImage(logo.dataUrl, 'JPEG', M, y - 2, lw, lh, 'lh-logo');
    textX = M + lw + 5;
  }
  const maxW = pageW - textX - M;
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
  const headerBottom = Math.max(ly, y + 22) + 1;
  doc.setDrawColor(14, 124, 90);
  doc.setLineWidth(0.6);
  doc.line(M, headerBottom, pageW - M, headerBottom);

  // ---- Title block --------------------------------------------------------
  let ty = headerBottom + 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text(pdfText(opts.title), M, ty, { maxWidth: pageW - 2 * M });
  ty += 5.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(6, 64, 43);
  doc.text(periodLine(opts.period, 'en'), M, ty);
  ty += 4.5;
  if (opts.subtitle) {
    doc.setTextColor(110);
    doc.text(pdfText(opts.subtitle), M, ty, { maxWidth: pageW - 2 * M });
    ty += 4.5;
  }

  // ---- Table --------------------------------------------------------------
  autoTable(doc, {
    head: [opts.headers.map(pdfText)],
    body: opts.rows.map((r) => r.map((c) => pdfText(cellText(c)))),
    startY: ty + 1,
    margin: { left: M, right: M, top: 14, bottom: 16 },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [14, 124, 90], textColor: 255 },
    alternateRowStyles: { fillColor: [246, 243, 234] },
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

  // ---- Signatures ---------------------------------------------------------
  let fy = (anyDoc.lastAutoTable?.finalY ?? ty) + 22;
  if (fy > pageH - 22) {
    doc.addPage();
    drawWatermark();
    fy = 40;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(40);
  doc.text(`${L.preparedBy}: ${opts.preparedBy || '________________________'}`, M, fy);
  const sigW = 55;
  const sx = pageW - M - sigW;
  doc.setDrawColor(120);
  doc.setLineWidth(0.3);
  doc.line(sx, fy - 1, sx + sigW, fy - 1);
  doc.text(L.authorized, sx + sigW / 2, fy + 4, { align: 'center' });

  doc.save(opts.filename.endsWith('.pdf') ? opts.filename : `${opts.filename}.pdf`);
}

/* ------------------------------------------------------------------ *
 *  Print (HTML window)
 * ------------------------------------------------------------------ */

const NUMERIC_RE = /^-?[\d,]+(\.\d+)?(\s?(Dr|Cr))?$/;

/** Letterhead + title + period block as HTML (shared by print and on-page previews). */
export function letterheadHtml(company: CompanyProfile | null | undefined, locale: 'en' | 'bn' = 'en'): string {
  if (!company) return '';
  const L = LABELS[locale];
  const logo = company.logo ? new URL(company.logo, window.location.origin).href : '';
  const lines = letterheadLines(company, L)
    .map((l) => `<p>${escapeHtml(l)}</p>`)
    .join('');
  return `<div class="lh">
      ${logo ? `<img src="${escapeHtml(logo)}" alt="">` : ''}
      <div>
        <h1>${escapeHtml(company.name)}</h1>
        ${company.license ? `<p class="lic">${escapeHtml(company.license)}</p>` : ''}
        ${lines}
      </div>
    </div>`;
}

/** Open a clean print window for a titled table (list print / ledger print). */
export function printTable(
  opts: {
    title: string;
    subtitle?: string;
    headers: string[];
    rows: Cell[][];
  } & ExportMeta,
) {
  const w = window.open('', '_blank', 'width=1000,height=700');
  if (!w) return;
  const locale = opts.locale ?? 'en';
  const L = LABELS[locale];
  const company = opts.company ?? null;
  const logo = company?.logo ? new URL(company.logo, window.location.origin).href : '';

  const head = opts.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = opts.rows
    .map(
      (r) =>
        `<tr>${r
          .map((c) => {
            const s = cellText(c);
            return `<td${NUMERIC_RE.test(s.trim()) && s.trim() ? ' class="num"' : ''}>${escapeHtml(s)}</td>`;
          })
          .join('')}</tr>`,
    )
    .join('');

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(opts.title)}</title>
    <style>
      *{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}
      body{margin:0;padding:22px 28px;color:#0a1410;background:#fff}
      .wm{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:58%;max-height:68%;object-fit:contain;opacity:.16;filter:grayscale(1) brightness(.45);pointer-events:none;z-index:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .content{position:relative;z-index:1}
      .lh{display:flex;gap:16px;align-items:flex-start;border-bottom:2px solid #0e7c5a;padding-bottom:10px}
      .lh img{width:78px;height:78px;object-fit:contain;flex:none}
      .lh h1{font-size:21px;margin:0;color:#06402b;line-height:1.15}
      .lh .lic{font-size:11px;font-weight:600;color:#555;margin:2px 0 4px}
      .lh p{margin:1px 0;font-size:11px;color:#333}
      h2{font-size:14.5px;font-weight:700;margin:12px 0 3px;color:#0a1410}
      p.period{font-size:11.5px;font-weight:600;color:#06402b;margin:0 0 2px}
      p.sub{font-size:11px;color:#555;margin:0 0 12px}
      table{width:100%;border-collapse:collapse;font-size:11px;background:transparent}
      thead{display:table-header-group}
      tr{page-break-inside:avoid}
      th,td{border:1px solid #cfd8d3;padding:5px 7px;text-align:left;vertical-align:top}
      th{background:#0e7c5a;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      td.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
      tr:nth-child(even) td{background:rgba(246,243,234,.7)}
      .sig{display:flex;justify-content:space-between;align-items:flex-end;margin-top:46px;font-size:11.5px;page-break-inside:avoid}
      .sig .prep{padding-bottom:4px}
      .sig .line{border-top:1px solid #444;padding-top:5px;min-width:210px;text-align:center;font-weight:600}
      @page{margin:12mm}
      @media print{.noprint{display:none}}
    </style></head><body>
      ${logo ? `<img class="wm" src="${escapeHtml(logo)}" alt="">` : ''}
      <div class="content">
        ${letterheadHtml(company, locale)}
        <h2>${escapeHtml(opts.title)}</h2>
        <p class="period">${escapeHtml(periodLine(opts.period, locale))}</p>
        ${opts.subtitle ? `<p class="sub">${escapeHtml(opts.subtitle)}</p>` : ''}
        <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
        <div class="sig">
          <div class="prep">${escapeHtml(L.preparedBy)}: ${escapeHtml(opts.preparedBy || '')}${opts.preparedBy ? '' : '________________________'}</div>
          <div class="line">${escapeHtml(L.authorized)}</div>
        </div>
      </div>
      <script>window.onload=function(){setTimeout(function(){window.print()},150)}</script>
    </body></html>`);
  w.document.close();
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
