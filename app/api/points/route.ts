// MODIFIED: 恢复 Edge 运行时声明，这是 Cloudflare Pages 部署的硬性要求
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const points = await prisma.knowledgePoint.findMany({
      // MODIFIED: 僅選擇列表需要的字段，大幅減小 JSON 體積 (效率優化)
      select: {
        id: true,
        pointName: true,
        module: true,
        difficulty: true,
        subject: true,
        grade: true,
        parents: {
          select: { id: true, pointName: true }
        }
      },
      orderBy: { id: 'asc' } // MODIFIED: 確保一致性
    });
    return NextResponse.json(Array.isArray(points) ? points : []);
  } catch (error) {
    // MODIFIED: 異常處理守恆，保留日誌
    console.error("API Error [Knowledge Points]:", error);
    return NextResponse.json([], { status: 500 });
  }
}