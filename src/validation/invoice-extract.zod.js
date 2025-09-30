const { z } = require('zod');

const numberLike = z.union([z.number(), z.string()]).transform((v) => {
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  if (!s) return undefined;
  const normalized = s
    .replace(/\s/g, '')
    .replace(/,(?=\d{3}(\D|$))/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(/,(\d{1,2})$/g, '.$1');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
});

const optionalString = z.union([z.string(), z.number()]).transform((v) => (v === undefined || v === null ? undefined : String(v))).optional();

const InvoiceExtractSchema = z.object({
  lineItems: z.array(z.object({
    productCode: z.string().optional(),
    description: z.string().optional(),
    hsCode: z.string().optional(),
    originCountry: z.string().optional(),
    farePreference: z.string().optional(),
    totalAmount: numberLike.optional(),
    netWeight: numberLike.optional(),
    grossWeight: numberLike.optional(),
    quantity: numberLike.optional(),
    UOM: z.string().optional(),
    // Additional fields for ALL table row types (charges, fees, taxes, etc.)
    type: z.string().optional(), // 'product', 'shipping', 'tax', 'fee', 'discount', 'other'
    rate: numberLike.optional(), // for percentage-based charges
    baseAmount: numberLike.optional(), // amount the rate is applied to
    currency: z.string().optional(),
    category: z.string().optional(), // additional categorization
  })).optional(),
  totalsAndSubtotals: z.array(z.object({
    airFee: numberLike.optional(),
    otherFee1: numberLike.optional(),
    insuranceFee: numberLike.optional(),
    rebate: numberLike.optional(),
    amountDue: numberLike.optional(),
    currency: optionalString,
    totalNetWeight: numberLike.optional(),
    totalGrossWeight: numberLike.optional(),
    totalQuantity: numberLike.optional(),
    totalVolume: numberLike.optional(),
  })),
  basicInformation: z.array(z.object({
    internalReference: optionalString,
    documentType: optionalString,
    documentNumber: optionalString,
    documentDate: optionalString,
    dispatchCountry: optionalString,
    finalDestination: optionalString,
    originCountries: optionalString,
    incoterms: optionalString,
    incotermsCity: optionalString,
    commodityCode: optionalString,
    totalPackages: numberLike.optional(),
    parcelType: optionalString,
  })),
  importer: z.array(z.object({
    name: optionalString,
    eoriNumber: numberLike.optional(),
    vatNumber: numberLike.optional(),
    address: optionalString,
    city: optionalString,
    zipCode: numberLike.optional(),
    country: optionalString,
  })),
  exporter: z.array(z.object({
    name: optionalString,
    eoriNumber: numberLike.optional(),
    vatNumber: numberLike.optional(),
    rexNumber: numberLike.optional(),
    address: optionalString,
    city: optionalString,
    zipCode: numberLike.optional(),
    country: optionalString,
  })),
});

module.exports = { InvoiceExtractSchema };
