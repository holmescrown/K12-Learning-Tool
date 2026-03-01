// MODIFIED: 强制 Edge 运行时和动态路由
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

export async function GET() {
  try {
    // 1. 获取 Cloudflare Pages 注入的上下文环境
    // 这将从您 wrangler.toml 中配置的 binding = "DB" 读取实例
    const env = getRequestContext().env;
    
    // 2. 将 D1 数据库绑定传入 Prisma Adapter
    const adapter = new PrismaD1(env.DB);
    const prisma = new PrismaClient({ adapter });

    // 3. 执行安全的 Select 查询
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