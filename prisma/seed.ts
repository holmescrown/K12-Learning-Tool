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

      // 第一阶段：确保所有节点都已存在（不处理关系，防止外键冲突）
      for (const point of points) {
        await prisma.knowledgePoint.upsert({
          where: { id: point.id },
          update: {
            subject: point.subject,
            grade: point.grade,
            module: point.module,
            pointName: point.pointName,
            weight: point.weight,
            difficulty: point.difficulty,
            content: point.content
          },
          create: {
            id: point.id,
            subject: point.subject,
            grade: point.grade,
            module: point.module,
            pointName: point.pointName,
            weight: point.weight,
            difficulty: point.difficulty,
            content: point.content
          }
        });
      }

      // 第二阶段：全量节点建立后，写入关联关系 (Graph Edges)
      for (const point of points) {
        if (point.parentIds && Array.isArray(point.parentIds) && point.parentIds.length > 0) {
          await prisma.knowledgePoint.update({
            where: { id: point.id },
            data: {
              parents: {
                // 使用 Prisma 的 connect 语法关联已存在的节点
                connect: point.parentIds.map((parentId: string) => ({ id: parentId }))
              }
            }
          });
        }
      }
      console.log(`✅ 已完成科目导入及图谱关系构建: ${file}`);
    } catch (error) {
      console.error(`❌ 导入 ${file} 时出错:`, error);
      continue;
    }
  }
}

main().catch(console.error);