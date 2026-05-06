import { NextResponse } from 'next/server';
import { gstQueries } from '@vmd/shared';

export async function GET(request, { params }) {
  try {
    const data = await gstQueries.getByMonth(params.yearMonth);
    return NextResponse.json(data || { year_month: params.yearMonth });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
