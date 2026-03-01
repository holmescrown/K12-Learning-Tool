// app/api/points/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET() {
  try {
    // MODIFIED: 强制追加 as any，彻底关闭 TypeScript 对 env.DB 的拦截检查
    const env = getRequestContext().env as any;
    
    // 现在 TypeScript 不会再报错说找不到 DB 了
    const adapter = new PrismaD1(env.DB);
    const prisma = new PrismaClient({ adapter });

    const points = await prisma.knowledgePoint.findMany({
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
      orderBy: { id: 'asc' }
    });

    return NextResponse.json(Array.isArray(points) ? points : []);
  } catch (error) {
    console.error("API Error [Knowledge Points]:", error);
    return NextResponse.json([], { status: 500 });
  }
}