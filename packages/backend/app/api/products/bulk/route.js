import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import prisma from '@vmd/shared/src/database/prisma';
import Product from '@vmd/shared/src/models/Product';
import { maxSkuNumberForBatch, formatSku } from '../../../../lib/generateSku';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });

    const sheetName = wb.SheetNames.includes('Products') ? 'Products' : wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in file' }, { status: 400 });
    }

    // Pre-load vendors
    const allVendors = await prisma.vendor.findMany({ select: { id: true, name: true } });
    const vendorMap = new Map(allVendors.map(v => [v.name.toLowerCase().trim(), v.id]));

    // Pre-load all existing products for name+vendor duplicate detection (SQLite has no ilike)
    const allProducts = await prisma.product.findMany({
      include: { vendor: { select: { name: true } } },
    });
    const existingByNameVendor = new Map();
    for (const p of allProducts) {
      const { vendor, ...rest } = p;
      existingByNameVendor.set(
        `${rest.name.toLowerCase()}::${rest.vendor_id}`,
        { ...rest, vendor_name: vendor?.name ?? null },
      );
    }

    let skuCounter = await maxSkuNumberForBatch();
    let created = 0;
    let updated = 0;
    const errors = [];
    const conflicts = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      try {
        const vendorName = String(row.vendor_name || '').trim();
        if (!vendorName) {
          errors.push({ row: rowNum, error: 'vendor_name is required' });
          continue;
        }
        const vendorId = vendorMap.get(vendorName.toLowerCase());
        if (!vendorId) {
          errors.push({ row: rowNum, error: `Vendor "${vendorName}" not found` });
          continue;
        }

        const productData = {
          name: row.name,
          hsn_code: String(row.hsn_code || ''),
          vendor_id: vendorId,
          vendor_name: vendorName,
          category: row.category || '',
          cost_price: row.cost_price !== '' ? row.cost_price : 0,
          selling_price: row.selling_price !== '' ? row.selling_price : 0,
          gst_rate: row.gst_rate !== '' ? row.gst_rate : 18,
          quantity_in_stock: row.quantity_in_stock !== '' ? row.quantity_in_stock : 0,
          unit: row.unit || 'pcs',
          notes: row.notes || '',
          description: row.description || '',
          length: row.length !== '' ? row.length : null,
          length_unit: row.length_unit || 'mm',
          width: row.width !== '' ? row.width : null,
          width_unit: row.width_unit || 'mm',
          height: row.height !== '' ? row.height : null,
          height_unit: row.height_unit || 'mm',
          gauge: row.gauge !== '' ? row.gauge : null,
          gauge_unit: row.gauge_unit || 'SWG',
          weight: row.weight !== '' ? row.weight : null,
          weight_unit: row.weight_unit || 'kg',
          dimension: row.dimension || '',
        };

        const rowSku = String(row.sku || '').trim();

        if (rowSku) {
          // SKU provided — upsert
          const product = new Product({ ...productData, sku: rowSku });
          const errs = product.validate();
          if (errs.length > 0) { errors.push({ row: rowNum, error: errs.join('; ') }); continue; }
          const dbObj = product.toDBObject();
          const existing = await prisma.product.findUnique({ where: { sku: rowSku } });
          if (existing) {
            await prisma.product.update({ where: { sku: rowSku }, data: dbObj });
            updated++;
          } else {
            await prisma.product.create({ data: dbObj });
            created++;
          }
        } else {
          // No SKU — check for name+vendor match
          const key = `${String(productData.name || '').toLowerCase()}::${vendorId}`;
          const existing = existingByNameVendor.get(key);
          if (existing) {
            conflicts.push({ row: rowNum, existing, incoming: productData });
          } else {
            skuCounter++;
            const sku = formatSku(skuCounter);
            const product = new Product({ ...productData, sku });
            const errs = product.validate();
            if (errs.length > 0) { errors.push({ row: rowNum, error: errs.join('; ') }); continue; }
            await prisma.product.create({ data: product.toDBObject() });
            created++;
          }
        }
      } catch (err) {
        const sku = String(row.sku || '').trim();
        if (err.message.includes('Unique constraint')) {
          errors.push({ row: rowNum, error: `SKU "${sku}" already exists` });
        } else {
          errors.push({ row: rowNum, error: err.message });
        }
      }
    }

    return NextResponse.json({ created, updated, errors, conflicts });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
