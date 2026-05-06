const prisma = require('../database/prisma');
const Exporters = require('../utils/exporters');
const Importers = require('../utils/importers');

class BackupService {
  async exportAll() {
    const [vendors, products, invoices, monthlyGST, settings] = await Promise.all([
      prisma.vendor.findMany(),
      prisma.product.findMany(),
      prisma.invoice.findMany({ include: { items: true } }),
      prisma.monthlyGst.findMany(),
      prisma.settings.findFirst(),
    ]);

    return Exporters.toJSON({ vendors, products, invoices, monthlyGST, settings });
  }

  async importAll(jsonString, options = { clearExisting: false }) {
    const data = Importers.fromJSON(jsonString);
    const errors = Importers.validateBackup(data);
    if (errors.length > 0) throw new Error(`Invalid backup: ${errors.join(', ')}`);

    await prisma.$transaction(async (tx) => {
      if (options.clearExisting) {
        await tx.invoiceItem.deleteMany();
        await tx.invoice.deleteMany();
        await tx.product.deleteMany();
        await tx.vendor.deleteMany();
        await tx.monthlyGst.deleteMany();
      }

      const vendorIdMap = {};
      for (const v of data.vendors) {
        const existing = await tx.vendor.findFirst({ where: { name: v.name } });
        if (!existing) {
          const created = await tx.vendor.create({
            data: {
              name: v.name,
              contact_person: v.contact_person || v.contactPerson || null,
              email: v.email || null,
              phone: v.phone || null,
              address: v.address || null,
              gst_number: v.gst_number || v.gstNumber || null,
            },
          });
          vendorIdMap[v.id] = created.id;
        } else {
          vendorIdMap[v.id] = existing.id;
        }
      }

      const productIdMap = {};
      for (const p of data.products) {
        const existing = await tx.product.findFirst({ where: { sku: p.sku } });
        if (!existing) {
          const vendorId = vendorIdMap[p.vendor_id] || p.vendor_id;
          const created = await tx.product.create({
            data: {
              name: p.name,
              sku: p.sku,
              vendor_id: vendorId,
              category: p.category || null,
              cost_price: p.cost_price,
              selling_price: p.selling_price,
              hsn_code: p.hsn_code || '',
              gst_rate: p.gst_rate || 18,
              quantity_in_stock: p.quantity_in_stock || 0,
              unit: p.unit || 'pcs',
              notes: p.notes || null,
            },
          });
          productIdMap[p.id] = created.id;
        } else {
          productIdMap[p.id] = existing.id;
        }
      }

      for (const inv of data.invoices) {
        const invoiceNumber = inv.invoice_number || inv.invoiceNumber;
        const existing = await tx.invoice.findFirst({ where: { invoice_number: invoiceNumber } });
        if (!existing) {
          const created = await tx.invoice.create({
            data: {
              invoice_number: invoiceNumber,
              invoice_date: inv.invoice_date || inv.invoiceDate,
              invoice_type: inv.invoice_type || inv.invoiceType,
              customer_name: inv.customer_name || inv.customerName,
              customer_email: inv.customer_email || inv.customerEmail || null,
              customer_address: inv.customer_address || inv.customerAddress || null,
              customer_gst: inv.customer_gst || inv.customerGST || null,
              total_amount_before_tax: inv.total_amount_before_tax || inv.totalAmountBeforeTax || 0,
              total_igst: inv.total_igst || inv.totalIGST || 0,
              total_cgst: inv.total_cgst || inv.totalCGST || 0,
              total_sgst: inv.total_sgst || inv.totalSGST || 0,
              total_tax: inv.total_tax || inv.totalTax || 0,
              total_amount_after_tax: inv.total_amount_after_tax || inv.totalAmountAfterTax || 0,
              status: inv.status || 'draft',
              notes: inv.notes || null,
            },
          });

          for (const item of inv.items || []) {
            const productId = productIdMap[item.product_id] || item.product_id || null;
            await tx.invoiceItem.create({
              data: {
                invoice_id: created.id,
                product_id: productId,
                item_name: item.item_name || item.itemName,
                quantity: item.quantity,
                unit_price: item.unit_price || item.unitPrice,
                amount: item.amount,
                gst_rate: item.gst_rate || item.gstRate || 0,
                igst: item.igst || 0,
                cgst: item.cgst || 0,
                sgst: item.sgst || 0,
                total_with_tax: item.total_with_tax || item.totalWithTax,
              },
            });
          }
        }
      }

      await tx.backupHistory.create({
        data: { backup_filename: `restore_${new Date().toISOString()}`, backup_type: 'manual' },
      });
    });

    return { success: true, message: 'Backup restored successfully' };
  }

  async recordBackup(filename, size, location) {
    return prisma.backupHistory.create({
      data: { backup_filename: filename, backup_size: size, backup_location: location, backup_type: 'manual' },
    });
  }

  async getBackupHistory() {
    return prisma.backupHistory.findMany({ orderBy: { backup_date: 'desc' } });
  }
}

module.exports = BackupService;
