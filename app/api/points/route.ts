// 必须添加这一行，否则 Cloudflare 无法处理 D1 数据库请求
export const runtime = 'edge';

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