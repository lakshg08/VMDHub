import { NextResponse } from 'next/server';
import { gstQueries } from '@vmd/shared';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const data = year ? await gstQueries.getByYear(year) : await gstQueries.getAll();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const {
      year_month,
      input_igst = 0,
      input_cgst = 0,
      input_sgst = 0,
      input_notes = '',
      output_igst = 0,
      output_cgst = 0,
      output_sgst = 0,
    } = await request.json();
    if (!year_month) {
      return NextResponse.json({ error: 'year_month is required (YYYY-MM)' }, { status: 400 });
    }
    await gstQueries.upsert({
      year_month, input_igst, input_cgst, input_sgst,
      input_notes, output_igst, output_cgst, output_sgst,
    });
    const record = await gstQueries.getByMonth(year_month);
    return NextResponse.json(record);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
