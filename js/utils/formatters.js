const ITBIS_RATE = 0.18;
const PAGE_W = 80;
const MARGIN_X = 8;
const INNER_W = PAGE_W - MARGIN_X * 2;
const FONT = 'helvetica';
const LINE_COLOR = [180, 180, 180];

const fmtMoney = (v) => '$' + v.toFixed(2);
const fmtMoneyInvoice = (v) => '$' + Math.round(v);
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const roundPeso = (n) => Math.round(Number(n) || 0);
const fmtDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function abbreviateText(doc, text, maxWidth) {
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && doc.getTextWidth(t + '...') > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + '...';
}
function pdfLine(doc, x, w, y) {
  doc.setDrawColor(...LINE_COLOR);
  doc.setLineWidth(0.4);
  doc.line(x, y, x + w, y);
}
function pdfTitle(doc, text, y) {
  doc.setFont(FONT, 'bold');
  doc.setFontSize(13);
  doc.text(text, PAGE_W / 2, y, { align: 'center' });
  return y + 5;
}
function pdfField(doc, label, value, y) {
  doc.setFont(FONT, 'bold');
  doc.setFontSize(9);
  doc.text(label, MARGIN_X, y, { align: 'left' });
  doc.setFont(FONT, 'normal');
  doc.text(value, MARGIN_X + INNER_W * 0.35, y, { align: 'left' });
  return y + 5;
}
function pdfCalcInvoiceHeight(data) {
  const base = 80;
  const items = data.items || [];
  const lines = Math.max(0, items.length - 3);
  const header = 20;
  const payments = data.payments && data.payments.length > 0 ? 20 + (data.payments.length * 4) : 0;
  const total = 30;
  return base + (lines * 8) + header + payments + total;
}

window.App = window.App || {};
window.App.Utils = window.App.Utils || {};
Object.assign(window.App.Utils, {
  ITBIS_RATE,
  PAGE_W,
  MARGIN_X,
  INNER_W,
  FONT,
  LINE_COLOR,
  fmtMoney,
  fmtMoneyInvoice,
  round2,
  roundPeso,
  fmtDate,
  abbreviateText,
  pdfLine,
  pdfTitle,
  pdfField,
  pdfCalcInvoiceHeight
});
