import { NextResponse } from 'next/server';
import QuotationService from '@vmd/shared/src/services/QuotationService';

export async function GET(request, { params }) {
  try {
    const svc = new QuotationService();
    const quotation = await svc.getById(params.id);
    if (!quotation) return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    return NextResponse.json(quotation.toJSON());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const svc = new QuotationService();
    const quotation = await svc.update(params.id, body);
    return NextResponse.json(quotation.toJSON());
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const svc = new QuotationService();
    await svc.delete(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
