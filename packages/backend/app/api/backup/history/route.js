import { NextResponse } from 'next/server';
import BackupService from '@vmd/shared/src/services/BackupService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const svc = new BackupService();
    const history = await svc.getBackupHistory();
    return NextResponse.json(history);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
