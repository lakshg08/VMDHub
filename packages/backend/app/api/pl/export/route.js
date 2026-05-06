import { NextResponse } from 'next/server';
import PLService from '@vmd/shared/src/services/PLService';
import { productQueries, Exporters } from '@vmd/shared';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
    const plService = new PLService();
    const products = await productQueries.getAll();
    const data = await plService.getMonthlyPL(year, products);
    const html = Exporters.plStatementToHTML({
      period: String(year),
      revenue: data.yearly.revenue,
      cost: data.yearly.cost,
      profit: data.yearly.profit,
      margin: data.yearly.margin,
      monthly: data.monthly,
    });
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
