import { NextResponse } from 'next/server';
import BackupService from '@vmd/shared/src/services/BackupService';

export async function GET() {
  try {
    const svc = new BackupService();
    const json = await svc.exportAll();
    const filename = `vmdhub-backup-${new Date().toISOString().split('T')[0]}.json`;
    await svc.recordBackup(filename, Buffer.byteLength(json), 'download');
    return new Response(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
