const prisma = require('../database/prisma');
const { Quotation, QuotationItem } = require('../models/Quotation');
const InvoiceService = require('./InvoiceService');

class QuotationService {
  async getAll() {
    const rows = await prisma.quotation.findMany({ orderBy: { quotation_date: 'desc' } });
    return rows.map(r => new Quotation(r));
  }

  async getById(id) {
    const row = await prisma.quotation.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });
    if (!row) return null;
    return new Quotation(row);
  }

  async create(data) {
    const quotation = new Quotation(data);
    if (!quotation.customerName) throw new Error('Customer name is required');
    if (!quotation.items || quotation.items.length === 0) throw new Error('Quotation must have at least one item');

    quotation.calculateTotals();
    await this._stampProductSnapshot(quotation.items);

    const createdId = await prisma.$transaction(async (tx) => {
      if (!quotation.quotationNumber) {
        quotation.quotationNumber = await this._generateNumber(tx, quotation.quotationDate);
      }

      if (data.saveNewCustomer && quotation.customerName) {
        const existing = await tx.customer.findFirst({ where: { name: quotation.customerName } });
        if (!existing) {
          const created = await tx.customer.create({
            data: {
              name: quotation.customerName,
              email: quotation.customerEmail || null,
              phone: quotation.customerPhone || null,
              gst_number: quotation.customerGST || null,
              ship_to_address: quotation.customerAddress || null,
            },
          });
          quotation.customerId = created.id;
        } else {
          quotation.customerId = existing.id;
        }
      }

      const created = await tx.quotation.create({ data: quotation.toDBObject() });

      for (const item of quotation.items) {
        await tx.quotationItem.create({ data: item.toDBObject(created.id) });
      }

      return created.id;
    });

    return this.getById(createdId);
  }

  async update(id, data) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Quotation not found');
    if (existing.status === 'converted') throw new Error('Cannot edit a converted quotation');

    const quotation = new Quotation({ ...existing.toJSON(), ...data });
    quotation.calculateTotals();
    await this._stampProductSnapshot(quotation.items);

    await prisma.$transaction(async (tx) => {
      await tx.quotation.update({ where: { id: Number(id) }, data: quotation.toDBObject() });
      await tx.quotationItem.deleteMany({ where: { quotation_id: Number(id) } });
      for (const item of quotation.items) {
        await tx.quotationItem.create({ data: item.toDBObject(Number(id)) });
      }
    });

    return this.getById(id);
  }

  async delete(id) {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Quotation not found');
    await prisma.quotation.delete({ where: { id: Number(id) } });
    return true;
  }

  async convertToInvoice(id) {
    const quotation = await this.getById(id);
    if (!quotation) throw new Error('Quotation not found');
    if (quotation.status === 'converted') throw new Error('Quotation already converted to invoice');

    const invoiceSvc = new InvoiceService();

    const nextInvoiceNumber = await invoiceSvc.getNextInvoiceNumber(quotation.quotationDate);

    const invoiceData = {
      invoice_number: nextInvoiceNumber,
      invoice_date: quotation.quotationDate,
      invoice_type: quotation.invoiceType,
      customer_name: quotation.customerName,
      customer_email: quotation.customerEmail,
      customer_address: quotation.customerAddress,
      customer_gst: quotation.customerGST,
      status: 'draft',
      notes: quotation.notes,
      items: quotation.items.map(i => ({
        product_id: i.productId,
        item_name: i.itemName,
        hsn_code: i.hsnCode,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        cost_price: i.costPrice,
        amount: i.amount,
        gst_rate: i.gstRate,
        igst: i.igst,
        cgst: i.cgst,
        sgst: i.sgst,
        total_with_tax: i.totalWithTax,
      })),
    };

    const invoice = await invoiceSvc.create(invoiceData);

    await prisma.quotation.update({
      where: { id: Number(id) },
      data: { status: 'converted', converted_invoice_id: invoice.id },
    });

    return invoice;
  }

  async getNextNumber(date = new Date().toISOString().split('T')[0]) {
    return this._generateNumber(prisma, date);
  }

  async _generateNumber(tx, date) {
    const prefix = this._getFYPrefix(date);
    const pattern = `Q-${prefix}/`;
    const last = await tx.quotation.findFirst({
      where: { quotation_number: { startsWith: pattern } },
      orderBy: { id: 'desc' },
      select: { quotation_number: true },
    });
    if (!last) return `${pattern}001`;
    const seq = parseInt(last.quotation_number.split('/')[1], 10) + 1;
    return `${pattern}${String(seq).padStart(3, '0')}`;
  }

  _getFYPrefix(dateStr) {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const startYear = month >= 4 ? year : year - 1;
    return `${startYear}-${String(startYear + 1).slice(-2)}`;
  }

  async _stampProductSnapshot(items) {
    const productIds = [...new Set(items.map(i => i.productId).filter(Boolean))];
    if (!productIds.length) return;
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, cost_price: true, hsn_code: true },
    });
    const map = new Map(products.map(p => [p.id, p]));
    for (const item of items) {
      const p = map.get(item.productId);
      if (p) {
        item.costPrice = p.cost_price;
        item.hsnCode = p.hsn_code;
      }
    }
  }
}

module.exports = QuotationService;
