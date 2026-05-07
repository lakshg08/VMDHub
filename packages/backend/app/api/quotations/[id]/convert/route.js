import { NextResponse } from 'next/server';
import QuotationService from '@vmd/shared/src/services/QuotationService';

export async function POST(request, { params }) {
  try {
    const svc = new QuotationService();
    const invoice = await svc.convertToInvoice(params.id);
    return NextResponse.json(invoice.toJSON ? invoice.toJSON() : invoice, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
