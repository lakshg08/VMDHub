import { NextResponse } from 'next/server';
import InvoiceService from '@vmd/shared/src/services/InvoiceService';

export const dynamic = 'force-dynamic';
import { Exporters } from '@vmd/shared';

export async function GET() {
  try {
    const svc = new InvoiceService();
    const invoices = await svc.getAll();
    const csv = Exporters.invoicesToCSV(invoices.map((i) => (i.toJSON ? i.toJSON() : i)));
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="invoices.csv"',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
