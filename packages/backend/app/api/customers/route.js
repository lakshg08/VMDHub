import { NextResponse } from 'next/server';
import { customerQueries } from '@vmd/shared';
import Customer from '@vmd/shared/src/models/Customer';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    let rows;
    if (search) {
      rows = await customerQueries.search(search);
    } else if (type) {
      rows = await customerQueries.getByType(type);
    } else {
      rows = await customerQueries.getAll();
    }
    return NextResponse.json(rows.map((r) => new Customer(r).toJSON()));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const customer = new Customer(body);
    const errors = customer.validate();
    if (errors.length > 0) return NextResponse.json({ error: errors.join('; ') }, { status: 400 });
    const created = await customerQueries.create(customer.toDBObject());
    return NextResponse.json(new Customer(created).toJSON(), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
