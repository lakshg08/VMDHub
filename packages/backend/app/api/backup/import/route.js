import { NextResponse } from 'next/server';
import BackupService from '@vmd/shared/src/services/BackupService';

export async function POST(request) {
  try {
    const { data, clearExisting = false } = await request.json();
    if (!data) return NextResponse.json({ error: 'No backup data provided' }, { status: 400 });
    const svc = new BackupService();
    const result = await svc.importAll(data, { clearExisting });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
