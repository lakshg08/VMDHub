import { NextResponse } from 'next/server';
import { vendorQueries } from '@vmd/shared';
import Vendor from '@vmd/shared/src/models/Vendor';

export async function GET() {
  try {
    const vendors = await vendorQueries.getAll();
    return NextResponse.json(vendors);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const vendor = new Vendor(body);
    const errors = vendor.validate();
    if (errors.length > 0) return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    const created = await vendorQueries.create(vendor.toDBObject());
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err.message.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Vendor name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
