import { NextResponse } from 'next/server';
import InvoiceService from '@vmd/shared/src/services/InvoiceService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const month = searchParams.get('month');
    const svc = new InvoiceService();
    let invoices;
    if (startDate && endDate) {
      invoices = await svc.getByDateRange(startDate, endDate);
    } else if (month) {
      invoices = await svc.getByMonth(month);
    } else {
      invoices = await svc.getAll();
    }
    return NextResponse.json(invoices.map((i) => (i.toJSON ? i.toJSON() : i)));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const svc = new InvoiceService();
    const invoice = await svc.create(body);
    return NextResponse.json(invoice.toJSON ? invoice.toJSON() : invoice, { status: 201 });
  } catch (err) {
    if (err.message.includes('Unique constraint') || err.message.includes('invoice number')) {
      return NextResponse.json({ error: 'Invoice number already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
