import { NextResponse } from 'next/server';
import { productQueries } from '@vmd/shared';
import Product from '@vmd/shared/src/models/Product';
import { generateSku } from '../../../lib/generateSku';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendor_id');
    const products = vendorId
      ? await productQueries.getByVendor(vendorId)
      : await productQueries.getAll();
    const role = request.headers.get('x-user-role');
    const data = role === 'staff'
      ? products.map(({ cost_price, ...rest }) => rest)
      : products;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const sku = body.sku?.trim() || await generateSku();
    const product = new Product({ ...body, sku });
    const errors = product.validate();
    if (errors.length > 0) return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    const created = await productQueries.create(product.toDBObject());
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
