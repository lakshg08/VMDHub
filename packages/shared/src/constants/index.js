const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28];

const INVOICE_TYPES = {
  INTERSTATE: 'interstate',
  INTRASTATE: 'intrastate',
};

const INVOICE_STATUSES = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

const PRODUCT_UNITS = ['pcs', 'kg', 'g', 'l', 'ml', 'm', 'cm', 'box', 'pack', 'set', 'dozen'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const FINANCIAL_YEAR_MONTHS = [
  { value: 1, label: 'January' },
  { value: 4, label: 'April (India Standard)' },
  { value: 7, label: 'July' },
  { value: 10, label: 'October' },
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

const DEFAULT_CURRENCY = 'INR';
const DEFAULT_GST_RATE = 18;
const DEFAULT_FINANCIAL_YEAR_START = 4;

module.exports = {
  GST_RATES,
  INVOICE_TYPES,
  INVOICE_STATUSES,
  PRODUCT_UNITS,
  MONTHS,
  FINANCIAL_YEAR_MONTHS,
  CURRENCIES,
  DEFAULT_CURRENCY,
  DEFAULT_GST_RATE,
  DEFAULT_FINANCIAL_YEAR_START,
};
