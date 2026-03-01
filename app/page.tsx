"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, BarChart3, X, Target, Zap } from 'lucide-react';

export default function KnowledgeLab() {
  const [points, setPoints] = useState<any[]>([]); // 初始化为空数组
  const [selectedPoint, setSelectedPoint] = useState<any>(null);

  useEffect(() => {
    fetch('/api/points')
      .then(res => res.json())
      .catch(() => []) // 报错时返回空数组
      .then(data => setPoints(Array.isArray(data) ? data : []));
  }, []);

  return (
    <div className="relative min-h-screen text-slate-200">
      {/* 极简网格背景 */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      <nav className="relative z-10 px-8 py-4 flex justify-between items-center border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Target size={18} className="text-white" />
          </div>
          <span className="font-bold tracking-widest text-sm uppercase">K12.Knowledge Lab</span>
        </div>
      </nav>

      <main className="relative z-0 p-10 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {points.length > 0 ? points.map((p: any) => (
          <motion.div
            key={p.id}
            whileHover={{ y: -5 }}
            onClick={() => setSelectedPoint(p)}
            className="cursor-pointer p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:border-blue-500/50 transition-all"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-mono text-blue-400">{p.id}</span>
              <Zap size={14} className="text-yellow-500" />
            </div>
            <h2 className="text-lg font-bold text-white">{p.pointName}</h2>
            <p className="text-[11px] text-slate-500 mt-2">{p.module} · L{p.difficulty}</p>
          </motion.div>
        )) : (
          <div className="col-span-full text-center py-20 text-slate-500">
            未发现知识点数据，请运行 seed 脚本导入...
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedPoint && (
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="fixed top-0 right-0 h-full w-[450px] bg-[#0d0d0d] border-l border-white/10 z-50 shadow-2xl p-8 overflow-y-auto"
          >
            <button onClick={() => setSelectedPoint(null)} className="absolute top-6 right-6 text-slate-500"><X /></button>
            <h3 className="text-2xl font-black text-white">{selectedPoint.pointName}</h3>
            
            {/* 新增逻辑：如果存在前置知识点图谱关系，则渲染标签 */}
            {selectedPoint.parents && selectedPoint.parents.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-slate-500 font-mono">前置知识链:</span>
                {selectedPoint.parents.map((parent: any) => (
                  <span key={parent.id} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded text-xs">
                    {parent.pointName}
                  </span>
                ))}
              </div>
            )}

            {/* 引导解析区域 */}
            <div className="mt-10 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-sm leading-relaxed">
              <div className="flex items-center gap-2 text-blue-400 mb-3 font-bold text-xs uppercase"><Lightbulb size={14}/> 引导启发</div>
              {selectedPoint.content || "内容正在生成中..."}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}