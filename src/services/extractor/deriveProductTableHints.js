/**
 * Derive ALL table hints from Azure Document Intelligence Layout response.
 * Inspects `layout.tables` and returns a compact glossary string and structured hints
 * to inform LLM extraction of ALL table rows (products, fees, taxes, etc.).
 */

/**
 * Normalize header cell text
 */
function norm(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9%]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const HEADER_PATTERNS = [
  ['code', 'sku', 'item', 'product', 'reference'],
  ['desc', 'description', 'details', 'service', 'charge'],
  ['qty', 'quantity', 'qte', 'units'],
  ['price', 'unit price', 'unit', 'rate', 'cost'],
  ['amount', 'total', 'sum', 'subtotal', 'value', 'fee'],
  ['tax', 'vat', 'tva', 'duty', 'tariff'],
  ['shipping', 'freight', 'delivery', 'transport'],
  ['discount', 'rebate', 'reduction', 'credit'],
];

/**
 * Score whether a header row matches any patterns.
 */
function scoreHeader(headers) {
  const hNorm = headers.map(norm);
  let score = 0;
  HEADER_PATTERNS.forEach(group => {
    if (hNorm.some(h => group.some(g => h.includes(g)))) score += 1;
  });
  return score;
}

/**
 * Build a human-readable glossary string and structured hints for ALL tables.
 * @param {any} layout
 * @returns {{ glossary: string, hints: any[] }}
 */
function deriveProductTableHints(layout) {
  const tables = layout.tables || [];
  const glossaryParts = [];
  const hints = [];

  tables.forEach((table, idx) => {
    if (!table.cells || table.cells.length === 0) return;

    // Extract header row (assume first row)
    const headerCells = table.cells.filter(c => c.rowIndex === 0);
    if (headerCells.length === 0) return;

    const headers = headerCells
      .sort((a, b) => a.columnIndex - b.columnIndex)
      .map(c => c.content || '');

    const score = scoreHeader(headers);
    
    // INCLUDE ALL TABLES - no minimum score requirement
    const headerStr = headers.join(', ');
    glossaryParts.push(`Table ${idx + 1} with headers: ${headerStr}`);
    hints.push({ tableIndex: idx, headers, score });
  });

  return { 
    glossary: glossaryParts.join(' \n '), 
    hints 
  };
}

module.exports = { deriveProductTableHints };
