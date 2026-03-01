"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, Target, Zap } from 'lucide-react';

// MODIFIED: 定義接口確保類型一致性 (符合 tsconfig)
interface KnowledgePoint {
  id: string;
  pointName: string;
  module: string;
  difficulty: number;
  content?: string;
  parents: { id: string; pointName: string }[];
}

export default function KnowledgeLab() {
  const [points, setPoints] = useState<KnowledgePoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<KnowledgePoint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // MODIFIED: 健壯性 - 防止內存洩漏
    const controller = new AbortController();
    setLoading(true);

    fetch('/api/points', { signal: controller.signal })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setPoints(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error("Fetch error:", err);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="relative min-h-screen text-slate-200">
      <div className="absolute inset-0 bg-[radial-gradient(#1e1e1e_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* PREVIOUS_CODE_BLOCK_RETAINED (Nav 保持不變) */}
      <nav className="relative z-10 px-8 py-4 flex justify-between items-center border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Target size={18} className="text-white" />
          </div>
          <span className="font-bold tracking-widest text-sm uppercase">K12.Knowledge Lab</span>
        </div>
      </nav>

      <main className="relative z-0 p-10 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {points.length > 0 ? points.map((p) => (
          <motion.div
            key={p.id}
            layout // MODIFIED: 優化重排效率
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
        )) : !loading && (
          <div className="col-span-full text-center py-20 text-slate-500">
            未發現知識點數據，請運行 seed 腳本導入...
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
            
            {/* MODIFIED: 健壯性 - 增加空值安全過濾 */}
            {selectedPoint.parents?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-slate-500 font-mono">前置知識鏈:</span>
                {selectedPoint.parents.filter(parent => parent.pointName).map((parent) => (
                  <span key={parent.id} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded text-xs">
                    {parent.pointName}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-10 p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-sm leading-relaxed">
              <div className="flex items-center gap-2 text-blue-400 mb-3 font-bold text-xs uppercase"><Lightbulb size={14}/> 引导启发</div>
              {/* MODIFIED: 異常分支處理 */}
              {selectedPoint.content || "内容正在生成中..."}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}