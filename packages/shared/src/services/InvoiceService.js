const prisma = require('../database/prisma');
const { Invoice, InvoiceItem } = require('../models/Invoice');
const Validators = require('../utils/validators');

class InvoiceService {
  async getAll() {
    const rows = await prisma.invoice.findMany({ orderBy: { invoice_date: 'desc' } });
    return rows.map((r) => new Invoice(r));
  }

  async getById(id) {
    const row = await prisma.invoice.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });
    if (!row) return null;
    return new Invoice(row);
  }

  async getByDateRange(startDate, endDate) {
    const rows = await prisma.invoice.findMany({
      where: { invoice_date: { gte: startDate, lte: endDate } },
      orderBy: { invoice_date: 'desc' },
    });
    return rows.map((r) => new Invoice(r));
  }

  async getByMonth(yearMonth) {
    const rows = await prisma.invoice.findMany({
      where: { invoice_date: { startsWith: yearMonth } },
      orderBy: { invoice_date: 'desc' },
    });
    return rows.map((r) => new Invoice(r));
  }

  async create(data) {
    const invoice = new Invoice(data);
    invoice.calculateTotals();

    const errors = Validators.validateInvoice({ ...invoice.toDBObject(), items: invoice.items });
    if (errors.length > 0) throw new Error(errors.join('; '));

    await this._stampProductSnapshot(invoice.items);
    await this._stampBankSnapshot(invoice);

    const invoiceId = await prisma.$transaction(async (tx) => {
      if (!invoice.invoiceNumber) {
        const prefix = this._getFYPrefix(invoice.invoiceDate);
        const last = await tx.invoice.findFirst({
          where: { invoice_number: { startsWith: `${prefix}/` } },
          orderBy: { id: 'desc' },
          select: { invoice_number: true },
        });
        if (!last) {
          invoice.invoiceNumber = `${prefix}/001`;
        } else {
          const seq = parseInt(last.invoice_number.split('/')[1], 10) + 1;
          invoice.invoiceNumber = `${prefix}/${String(seq).padStart(3, '0')}`;
        }
      }

      const created = await tx.invoice.create({ data: invoice.toDBObject() });

      for (const item of invoice.items) {
        await tx.invoiceItem.create({ data: item.toDBObject(created.id) });
      }

      return created.id;
    });

    return this.getById(invoiceId);
  }

  async update(id, data) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Invoice not found');

    const invoice = new Invoice({ ...existing.toJSON(), ...data });
    invoice.calculateTotals();

    await this._stampProductSnapshot(invoice.items);

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({ where: { id: Number(id) }, data: invoice.toDBObject() });
      await tx.invoiceItem.deleteMany({ where: { invoice_id: Number(id) } });
      for (const item of invoice.items) {
        await tx.invoiceItem.create({ data: item.toDBObject(Number(id)) });
      }
    });

    return this.getById(id);
  }

  async delete(id) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Invoice not found');
    await prisma.invoice.delete({ where: { id: Number(id) } });
    return true;
  }

  async _stampBankSnapshot(invoice) {
    const settings = await prisma.settings.findFirst();
    if (!settings) return;
    invoice.bankUpiId = settings.upi_id || '';
    invoice.bankName = settings.bank_name || '';
    invoice.bankAccountNumber = settings.bank_account_number || '';
    invoice.bankAccountType = settings.bank_account_type || '';
    invoice.bankIfsc = settings.bank_ifsc || '';
  }

  async _stampProductSnapshot(items) {
    const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean).map(Number))].filter(n => !isNaN(n));
    if (!productIds.length) return;
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, cost_price: true, hsn_code: true },
    });
    const map = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      const p = map.get(item.productId);
      if (p) {
        item.costPrice = p.cost_price;
        item.hsnCode = p.hsn_code;
      }
    }
  }

  async getNextInvoiceNumber(date = new Date().toISOString().split('T')[0]) {
    const prefix = this._getFYPrefix(date);
    const last = await prisma.invoice.findFirst({
      where: { invoice_number: { startsWith: `${prefix}/` } },
      orderBy: { id: 'desc' },
      select: { invoice_number: true },
    });
    if (!last) return `${prefix}/001`;
    const seq = parseInt(last.invoice_number.split('/')[1], 10) + 1;
    return `${prefix}/${String(seq).padStart(3, '0')}`;
  }

  _getFYPrefix(dateStr) {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const startYear = month >= 4 ? year : year - 1;
    return `${startYear}-${String(startYear + 1).slice(-2)}`;
  }
}

module.exports = InvoiceService;
