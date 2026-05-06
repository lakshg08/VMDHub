const prisma = require('./prisma');

// Customer queries
const customerQueries = {
  getAll: () => prisma.customer.findMany({ orderBy: { name: 'asc' } }),

  getById: (id) => prisma.customer.findUnique({ where: { id: Number(id) } }),

  getByType: (type) => {
    if (type === 'corporate') {
      return prisma.customer.findMany({
        where: { AND: [{ gst_number: { not: null } }, { gst_number: { not: '' } }] },
        orderBy: { name: 'asc' },
      });
    }
    return prisma.customer.findMany({
      where: { OR: [{ gst_number: null }, { gst_number: '' }] },
      orderBy: { name: 'asc' },
    });
  },

  create: (data) => prisma.customer.create({ data }),

  update: (id, data) =>
    prisma.customer.update({ where: { id: Number(id) }, data }),

  delete: (id) => prisma.customer.delete({ where: { id: Number(id) } }),

  search: (query) =>
    prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { gst_number: { contains: query } },
        ],
      },
    }),
};

// Vendor queries
const vendorQueries = {
  getAll: () => prisma.vendor.findMany({ orderBy: { name: 'asc' } }),

  getById: (id) => prisma.vendor.findUnique({ where: { id: Number(id) } }),

  create: (data) => prisma.vendor.create({ data }),

  update: (id, data) =>
    prisma.vendor.update({ where: { id: Number(id) }, data }),

  delete: (id) => prisma.vendor.delete({ where: { id: Number(id) } }),

  search: (query) =>
    prisma.vendor.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { contact_person: { contains: query } },
          { email: { contains: query } },
        ],
      },
    }),
};

// Product queries
const productQueries = {
  getAll: async () => {
    const products = await prisma.product.findMany({
      include: { vendor: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
    return products.map(({ vendor, ...p }) => ({ ...p, vendor_name: vendor?.name ?? null }));
  },

  getById: async (id) => {
    const p = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { vendor: { select: { name: true } } },
    });
    if (!p) return null;
    const { vendor, ...rest } = p;
    return { ...rest, vendor_name: vendor?.name ?? null };
  },

  getByVendor: (vendorId) =>
    prisma.product.findMany({
      where: { vendor_id: Number(vendorId) },
      orderBy: { name: 'asc' },
    }),

  create: (data) => prisma.product.create({ data }),

  update: (id, data) =>
    prisma.product.update({ where: { id: Number(id) }, data }),

  delete: (id) => prisma.product.delete({ where: { id: Number(id) } }),

  updateStock: (id, quantity) =>
    prisma.product.update({
      where: { id: Number(id) },
      data: { quantity_in_stock: { increment: quantity } },
    }),
};

// Invoice queries
const invoiceQueries = {
  getAll: () => prisma.invoice.findMany({ orderBy: { invoice_date: 'desc' } }),

  getById: (id) => prisma.invoice.findUnique({ where: { id: Number(id) } }),

  getByNumber: (number) =>
    prisma.invoice.findUnique({ where: { invoice_number: number } }),

  getWithItems: (id) =>
    prisma.invoice.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    }),

  getByDateRange: (startDate, endDate) =>
    prisma.invoice.findMany({
      where: { invoice_date: { gte: startDate, lte: endDate } },
      orderBy: { invoice_date: 'desc' },
    }),

  getByMonth: (yearMonth) =>
    prisma.invoice.findMany({
      where: { invoice_date: { startsWith: yearMonth } },
      orderBy: { invoice_date: 'desc' },
    }),

  create: (data) => prisma.invoice.create({ data }),

  update: (id, data) =>
    prisma.invoice.update({ where: { id: Number(id) }, data }),

  delete: (id) => prisma.invoice.delete({ where: { id: Number(id) } }),

  getNextNumber: async () => {
    const last = await prisma.invoice.findFirst({
      orderBy: { id: 'desc' },
      select: { invoice_number: true },
    });
    if (!last) return 'INV-0001';
    const num = parseInt(last.invoice_number.replace('INV-', ''), 10) + 1;
    return `INV-${String(num).padStart(4, '0')}`;
  },
};

// Invoice item queries
const invoiceItemQueries = {
  getByInvoice: (invoiceId) =>
    prisma.invoiceItem.findMany({ where: { invoice_id: Number(invoiceId) } }),

  create: (data) => prisma.invoiceItem.create({ data }),

  deleteByInvoice: (invoiceId) =>
    prisma.invoiceItem.deleteMany({ where: { invoice_id: Number(invoiceId) } }),
};

// GST queries
const gstQueries = {
  getAll: () => prisma.monthlyGst.findMany({ orderBy: { year_month: 'desc' } }),

  getByYear: (year) =>
    prisma.monthlyGst.findMany({
      where: { year_month: { startsWith: year } },
      orderBy: { year_month: 'asc' },
    }),

  getByMonth: (yearMonth) =>
    prisma.monthlyGst.findUnique({ where: { year_month: yearMonth } }),

  upsert: (data) =>
    prisma.monthlyGst.upsert({
      where: { year_month: data.year_month },
      create: data,
      update: {
        input_igst: data.input_igst,
        input_cgst: data.input_cgst,
        input_sgst: data.input_sgst,
        input_notes: data.input_notes,
        output_igst: data.output_igst,
        output_cgst: data.output_cgst,
        output_sgst: data.output_sgst,
      },
    }),
};

// Settings queries
const settingsQueries = {
  get: () => prisma.settings.findFirst(),

  upsert: async (data) => {
    const existing = await prisma.settings.findFirst();
    if (existing) {
      return prisma.settings.update({ where: { id: existing.id }, data });
    }
    return prisma.settings.create({ data });
  },
};

module.exports = {
  customerQueries,
  vendorQueries,
  productQueries,
  invoiceQueries,
  invoiceItemQueries,
  gstQueries,
  settingsQueries,
};
