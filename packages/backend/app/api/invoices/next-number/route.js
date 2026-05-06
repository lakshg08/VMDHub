import { NextResponse } from 'next/server';
import InvoiceService from '@vmd/shared/src/services/InvoiceService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const svc = new InvoiceService();
    const nextNumber = await svc.getNextInvoiceNumber();
    return NextResponse.json({ nextNumber });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
