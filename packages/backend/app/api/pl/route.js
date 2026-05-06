import { NextResponse } from 'next/server';
import PLService from '@vmd/shared/src/services/PLService';
import { productQueries } from '@vmd/shared';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year')) || new Date().getFullYear();
    const [plService, products] = [new PLService(), await productQueries.getAll()];
    const data = await plService.getMonthlyPL(year, products);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
