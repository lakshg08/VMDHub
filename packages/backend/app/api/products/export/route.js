import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { productQueries } from '@vmd/shared';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const role = request.headers.get('x-user-role');
    const products = await productQueries.getAll();

    const rows = products.map(p => {
      const row = {
        sku: p.sku,
        name: p.name,
        hsn_code: p.hsn_code,
        vendor_name: p.vendor_name,
        category: p.category ?? '',
        gst_rate: p.gst_rate,
        selling_price: p.selling_price,
        quantity_in_stock: p.quantity_in_stock,
        unit: p.unit,
        description: p.description ?? '',
        length: p.length ?? '',
        length_unit: p.length != null ? p.length_unit : '',
        width: p.width ?? '',
        width_unit: p.width != null ? p.width_unit : '',
        height: p.height ?? '',
        height_unit: p.height != null ? p.height_unit : '',
        gauge: p.gauge ?? '',
        gauge_unit: p.gauge != null ? p.gauge_unit : '',
        weight: p.weight ?? '',
        weight_unit: p.weight != null ? p.weight_unit : '',
        dimension: p.dimension ?? '',
        notes: p.notes ?? '',
      };
      if (role === 'admin') {
        row.cost_price = p.cost_price;
      }
      return row;
    });

    const adminHeaders = ['sku', 'name', 'hsn_code', 'vendor_name', 'category', 'cost_price', 'gst_rate', 'selling_price', 'quantity_in_stock', 'unit', 'description', 'length', 'length_unit', 'width', 'width_unit', 'height', 'height_unit', 'gauge', 'gauge_unit', 'weight', 'weight_unit', 'dimension', 'notes'];
    const staffHeaders  = ['sku', 'name', 'hsn_code', 'vendor_name', 'category', 'gst_rate', 'selling_price', 'quantity_in_stock', 'unit', 'description', 'length', 'length_unit', 'width', 'width_unit', 'height', 'height_unit', 'gauge', 'gauge_unit', 'weight', 'weight_unit', 'dimension', 'notes'];
    const headers = role === 'admin' ? adminHeaders : staffHeaders;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 14) }));
    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const date = ist.toISOString().slice(0, 10);
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="products-${date}.xlsx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
