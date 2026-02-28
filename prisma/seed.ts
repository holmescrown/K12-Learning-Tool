// 关键：在加载 Prisma 之前强行注入，确保 WASM 引擎初始化时能抓到值
process.env.DATABASE_URL = 'file:./dev.db';

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function main() {
  const prisma = new PrismaClient();

  const dataDir = path.join(process.cwd(), 'data/subjects');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

  console.log(`🔍 发现 ${files.length} 个科目数据文件，准备导入...`);

  for (const file of files) {
    try {
      const rawData = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      const points = JSON.parse(rawData);

      for (const point of points) {
        await prisma.knowledgePoint.upsert({
          where: { id: point.id },
          update: {},
          create: {
            id: point.id,
            subject: point.subject,
            grade: point.grade,
            module: point.module,
            pointName: point.pointName,
            weight: point.weight,
            difficulty: point.difficulty,
            content: point.content
            // 移除了 parentIds 的处理，使用 Prisma 的多对多自关联
          }
        });
      }
      console.log(`✅ 已完成科目导入: ${file}`);
    } catch (error) {
      console.error(`❌ 导入 ${file} 时出错:`, error);
      continue; // 跳过出错的文件，继续处理其他文件
    }
  }
}

main().catch(console.error);