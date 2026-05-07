import { NextResponse } from 'next/server';
import prisma from '@vmd/shared/src/database/prisma';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const { folderPath } = await request.json();

  if (!folderPath || typeof folderPath !== 'string') {
    return NextResponse.json({ error: 'folderPath is required' }, { status: 400 });
  }
  if (!fs.existsSync(folderPath)) {
    return NextResponse.json({ error: `Folder not found: ${folderPath}` }, { status: 400 });
  }

  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const ts = ist.toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
  const filename = `vmdhub-backup-${ts}_IST.db`;
  const tempPath = path.join(process.cwd(), '../..', 'data', filename);
  const destPath = path.join(folderPath, filename);

  try {
    // VACUUM INTO creates a clean, consistent copy of the live SQLite database
    await prisma.$executeRawUnsafe(`VACUUM INTO '${tempPath}'`);
    fs.copyFileSync(tempPath, destPath);
    return NextResponse.json({ filename });
  } catch (err) {
    console.error('Backup error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}
