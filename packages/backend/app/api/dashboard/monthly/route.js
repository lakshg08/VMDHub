import { NextResponse } from 'next/server';
import prisma from '@vmd/shared/src/database/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const monthKeys = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const startDate = `${monthKeys[0]}-01`;
    const [endYear, endMon] = monthKeys[monthKeys.length - 1].split('-').map(Number);
    const lastDay = new Date(endYear, endMon, 0).getDate();
    const endDate = `${monthKeys[monthKeys.length - 1]}-${String(lastDay).padStart(2, '0')}`;

    const invoices = await prisma.invoice.findMany({
      where: {
        invoice_date: { gte: startDate, lte: endDate },
        status: 'paid',
      },
      select: { invoice_date: true, total_amount_after_tax: true, total_tax: true },
    });

    const grouped = {};
    for (const inv of invoices) {
      const ym = inv.invoice_date.substring(0, 7);
      if (!grouped[ym]) grouped[ym] = { count: 0, revenue: 0, tax: 0 };
      grouped[ym].count++;
      grouped[ym].revenue += inv.total_amount_after_tax || 0;
      grouped[ym].tax += inv.total_tax || 0;
    }

    const months = monthKeys.map((ym) => {
      const d = grouped[ym] || { count: 0, revenue: 0, tax: 0 };
      return { month: ym.slice(5), yearMonth: ym, count: d.count, revenue: d.revenue, tax: d.tax };
    });

    return NextResponse.json(months);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
