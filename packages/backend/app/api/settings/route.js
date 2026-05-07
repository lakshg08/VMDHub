import { NextResponse } from 'next/server';
import { settingsQueries } from '@vmd/shared';

export async function GET() {
  try {
    const settings = await settingsQueries.get();
    return NextResponse.json(settings || {});
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    await settingsQueries.upsert({
      company_name: body.company_name || '',
      company_email: body.company_email || '',
      company_address: body.company_address || '',
      company_gst: body.company_gst || '',
      company_phone: body.company_phone || '',
      company_website: body.company_website || '',
      financial_year_start: body.financial_year_start || 4,
      currency: body.currency || 'INR',
      upi_id: body.upi_id || '',
      bank_name: body.bank_name || '',
      bank_account_number: body.bank_account_number || '',
      bank_account_type: body.bank_account_type || '',
      bank_ifsc: body.bank_ifsc || '',
    });
    const settings = await settingsQueries.get();
    return NextResponse.json(settings);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
