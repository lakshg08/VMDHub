import { NextResponse } from 'next/server';
import { productQueries } from '@vmd/shared';
import Product from '@vmd/shared/src/models/Product';

export async function GET(request, { params }) {
  try {
    const product = await productQueries.getById(params.id);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const existing = await productQueries.getById(params.id);
    if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    const body = await request.json();
    const product = new Product({ ...existing, ...body });
    const errors = product.validate();
    if (errors.length > 0) return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    const updated = await productQueries.update(params.id, product.toDBObject());
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const existing = await productQueries.getById(params.id);
    if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    await productQueries.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
