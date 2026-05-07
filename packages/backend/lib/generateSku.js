import prisma from '@vmd/shared/src/database/prisma';

async function maxSkuNumber() {
  const rows = await prisma.product.findMany({
    where: { sku: { startsWith: 'SKU-' } },
    select: { sku: true },
  });
  let max = 0;
  for (const { sku } of rows) {
    const m = sku.match(/^SKU-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

export function formatSku(n) {
  return `SKU-${String(n).padStart(4, '0')}`;
}

export async function generateSku() {
  return formatSku((await maxSkuNumber()) + 1);
}

export async function maxSkuNumberForBatch() {
  return maxSkuNumber();
}
