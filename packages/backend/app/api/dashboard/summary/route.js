import { NextResponse } from 'next/server';
import PLService from '@vmd/shared/src/services/PLService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plService = new PLService();
    const summary = await plService.getDashboardSummary();
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
