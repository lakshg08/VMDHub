import { NextResponse } from 'next/server';
import InvoiceService from '@vmd/shared/src/services/InvoiceService';

export async function GET(request, { params }) {
  try {
    const svc = new InvoiceService();
    const invoice = await svc.getById(params.id);
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json(invoice.toJSON ? invoice.toJSON() : invoice);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const svc = new InvoiceService();
    const invoice = await svc.update(params.id, body);
    return NextResponse.json(invoice.toJSON ? invoice.toJSON() : invoice);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const svc = new InvoiceService();
    await svc.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
