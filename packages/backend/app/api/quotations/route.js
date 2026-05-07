import { NextResponse } from 'next/server';
import QuotationService from '@vmd/shared/src/services/QuotationService';

export async function GET() {
  try {
    const svc = new QuotationService();
    const quotations = await svc.getAll();
    return NextResponse.json(quotations.map(q => q.toJSON()));
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const svc = new QuotationService();
    const quotation = await svc.create(body);
    return NextResponse.json(quotation.toJSON(), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
