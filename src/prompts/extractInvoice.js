function buildExtractPrompt({ markdown, tablesGlossary, interfaceCode }) {
  const system = "You are a comprehensive extraction engine. Extract EVERY SINGLE table row as a lineItem. Include products, shipping charges, taxes, fees, discounts, handling charges, insurance, customs duties - EVERYTHING. Output ONLY a JSON object that matches the provided TypeScript interface.";
  const user = {
    markdown,
    tables_glossary: tablesGlossary,
    interface: interfaceCode,
    extraction_rules: [
      "CRITICAL: Extract EVERY table row as a lineItem. Do not skip any rows.",
      "1) Products: Set type='product', include productCode, description, hsCode, quantities, amounts",
      "2) Shipping/Freight: Set type='shipping', include description and amount",
      "3) Taxes/VAT/Duties: Set type='tax', include description, rate (if %), amount",
      "4) Fees/Charges: Set type='fee', include description and amount", 
      "5) Discounts/Rebates: Set type='discount', include description and amount",
      "6) Other charges: Set type='other', include description and amount",
      "7) Include subtotals, totals, and summary rows as separate lineItems",
      "8) Maintain original table order. Merge wrapped lines. Set originCountry from context.",
      "9) Extract from ALL tables - do not exclude any table. Every data row becomes a lineItem.",
      "10) Return strict JSON only—no commentary.",
    ],
  };
  return { system, user };
}

module.exports = { buildExtractPrompt };
