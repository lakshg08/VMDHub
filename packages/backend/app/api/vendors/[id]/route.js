import { NextResponse } from 'next/server';
import { vendorQueries } from '@vmd/shared';
import Vendor from '@vmd/shared/src/models/Vendor';

export async function GET(request, { params }) {
  try {
    const vendor = await vendorQueries.getById(params.id);
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    return NextResponse.json(vendor);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const existing = await vendorQueries.getById(params.id);
    if (!existing) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    const body = await request.json();
    const vendor = new Vendor({ ...existing, ...body });
    const errors = vendor.validate();
    if (errors.length > 0) return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    const updated = await vendorQueries.update(params.id, vendor.toDBObject());
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const existing = await vendorQueries.getById(params.id);
    if (!existing) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    await vendorQueries.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
