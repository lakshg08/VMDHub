import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken } from '../../../../lib/auth';
import prisma from '@vmd/shared/src/database/prisma';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const token = await signToken({ id: user.id, username: user.username, role: user.role });
    return NextResponse.json({ token, role: user.role, username: user.username });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
