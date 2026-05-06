import { NextResponse } from 'next/server';
import { customerQueries } from '@vmd/shared';
import Customer from '@vmd/shared/src/models/Customer';

export async function GET(request, { params }) {
  try {
    const row = await customerQueries.getById(params.id);
    if (!row) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    return NextResponse.json(new Customer(row).toJSON());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const existing = await customerQueries.getById(params.id);
    if (!existing) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    const body = await request.json();
    const customer = new Customer({ ...existing, ...body });
    const errors = customer.validate();
    if (errors.length > 0) return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    const updated = await customerQueries.update(params.id, customer.toDBObject());
    return NextResponse.json(new Customer(updated).toJSON());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const existing = await customerQueries.getById(params.id);
    if (!existing) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    await customerQueries.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
