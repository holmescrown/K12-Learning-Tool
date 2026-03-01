// 🚨 修复：在本地使用 SQLite 时，绝对不能使用 Edge Runtime，因为它无法读取本地 .db 文件。
// 部署到 Cloudflare D1 时需要配合专门的 Prisma D1 Adapter，本地开发请务必注释掉此行。
// export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// 单例模式防止开发环境下创建过多连接
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET() {
  try {
    const points = await prisma.knowledgePoint.findMany({
      include: {
        parents: true,
      },
    });
    // 强制确保返回的是数组
    return NextResponse.json(Array.isArray(points) ? points : []);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json([], { status: 500 });
  }
}