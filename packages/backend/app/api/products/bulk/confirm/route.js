import { NextResponse } from 'next/server';
import prisma from '@vmd/shared/src/database/prisma';
import Product from '@vmd/shared/src/models/Product';

export async function POST(request) {
  try {
    const items = await request.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }

    let updated = 0;
    const errors = [];

    for (const item of items) {
      const { id, ...data } = item;
      try {
        const product = new Product(data);
        const errs = product.validate();
        if (errs.length > 0) {
          errors.push({ id, error: errs.join('; ') });
          continue;
        }
        await prisma.product.update({
          where: { id: Number(id) },
          data: product.toDBObject(),
        });
        updated++;
      } catch (err) {
        errors.push({ id, error: err.message });
      }
    }

    return NextResponse.json({ updated, errors });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
