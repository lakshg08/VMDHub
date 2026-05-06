import { NextResponse } from 'next/server';
import InvoiceService from '@vmd/shared/src/services/InvoiceService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const svc = new InvoiceService();
    const nextNumber = await svc.getNextInvoiceNumber(date);
    return NextResponse.json({ nextNumber });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
