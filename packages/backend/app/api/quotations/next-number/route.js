import { NextResponse } from 'next/server';
import QuotationService from '@vmd/shared/src/services/QuotationService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const svc = new QuotationService();
    const nextNumber = await svc.getNextNumber(date);
    return NextResponse.json({ nextNumber });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
