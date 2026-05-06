import { NextResponse } from 'next/server';
import prisma from '@vmd/shared/src/database/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    const invoices = await prisma.invoice.findMany({
      where: {
        NOT: { status: 'cancelled' },
        ...(year ? { invoice_date: { startsWith: year } } : {}),
      },
      select: { invoice_date: true, total_igst: true, total_cgst: true, total_sgst: true },
    });

    const map = {};
    for (const inv of invoices) {
      const ym = inv.invoice_date.substring(0, 7);
      if (!map[ym]) map[ym] = { year_month: ym, igst: 0, cgst: 0, sgst: 0 };
      map[ym].igst += inv.total_igst || 0;
      map[ym].cgst += inv.total_cgst || 0;
      map[ym].sgst += inv.total_sgst || 0;
    }

    return NextResponse.json(map);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
