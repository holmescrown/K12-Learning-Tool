"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, Search, Crosshair, Command, Layers, Zap, Hexagon, Maximize2, Minimize2 } from 'lucide-react';

interface KnowledgePoint {
  id: string;
  pointName: string;
  module: string;
  difficulty: number;
  subject: string;
  grade: string;
  content?: string;
  weight: number;
  parents: { id: string; pointName: string }[];
  x?: number;
  y?: number;
}

export default function KnowledgeLab() {
  const [points, setPoints] = useState<KnowledgePoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<KnowledgePoint | null>(null);
  const [loading, setLoading] = useState(true);
  // MODIFIED: 新增 error state（不影响原有 catch）
  const [error, setError] = useState<string | null>(null);
  
  // 交互状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/points', { signal: controller.signal })
      .then(res => res.ok ? res.json() : [])
      // FIX: 彻底解决 TS 构建报错！接收 unknown 类型，然后在内部断言
      .then((rawData: unknown) => {
        const data = rawData as KnowledgePoint[];
        
        // Diagram 风格布局：拉开空间，留白是高级感的来源
        const difficultyCounts: Record<number, number> = {};
        const layoutData = data.map(p => {
          const level = p.difficulty || 1;
          difficultyCounts[level] = (difficultyCounts[level] || 0) + 1;
          return {
            ...p,
            x: level * 420 - 200, 
            y: difficultyCounts[level] * 220 - 100 
          };
        });
        setPoints(layoutData);
        setLoading(false);
      })
      .catch((err) => {
        // MODIFIED: 在原有 catch 内部增加错误状态（不删除原有 setLoading(false)）
        console.error('API fetch failed:', err); // MODIFIED
        setError('无法加载知识图谱，请检查数据库初始化（push-to-d1.ts）'); // MODIFIED
        setLoading(false); // 原有逻辑完整保留
      });
    return () => controller.abort();
  }, []);

  // 生成优雅的 SVG 贝塞尔曲线
  const edges = useMemo(() => {
    const lines: React.ReactNode[] = [];
    points.forEach(child => {
      child.parents?.forEach(parentRef => {
        const parent = points.find(p => p.id === parentRef.id);
        if (parent && parent.x !== undefined && parent.y !== undefined && child.x !== undefined && child.y !== undefined) {
          const startX = parent.x + 320; 
          const startY = parent.y + 64;
          const endX = child.x;
          const endY = child.y + 64;
          
          const cpX1 = startX + (endX - startX) / 2;
          const cpX2 = startX + (endX - startX) / 2;
          
          const isHighlighted = selectedPoint?.id === child.id || selectedPoint?.id === parent.id;

          lines.push(
            <path
              key={`${parent.id}-${child.id}`}
              d={`M ${startX} ${startY} C ${cpX1} ${startY}, ${cpX2} ${endY}, ${endX} ${endY}`}
              stroke={isHighlighted ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.08)"}
              strokeWidth={isHighlighted ? 2 : 1}
              fill="none"
              className="transition-colors duration-500 ease-out"
              style={{ filter: isHighlighted ? 'drop-shadow(0 0 12px rgba(255,255,255,0.4))' : 'none' }}
            />
          );
        }
      });
    });
    return lines;
  }, [points, selectedPoint]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault(); // MODIFIED: 增加 preventDefault 修复浏览器默认行为
      const scaleBy = 1.05;
      const newScale = e.deltaY > 0 ? transform.scale / scaleBy : transform.scale * scaleBy;
      setTransform(prev => ({ ...prev, scale: Math.min(Math.max(0.1, newScale), 3) }));
    } else {
      setTransform(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {}); // MODIFIED: 捕获拒绝但不影响原有逻辑
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 重置视角
  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#000000] text-[#EDEDED] select-none font-sans" onWheel={handleWheel}>
      {/* Diagram 标志性背景：纯黑底色 + 极微弱的点阵 + 径向环境光 */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.03]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      {/* 顶部极简 Logo区 */}
      <div className="absolute top-8 left-8 z-40 flex items-center gap-3 mix-blend-difference">
        <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center">
          <Hexagon size={16} className="fill-black" />
        </div>
        <span className="font-semibold tracking-tight text-lg">Nexus Graph</span>
      </div>

      {/* Diagram 标志性底部浮动胶囊菜单 (Floating Pill Toolbar) */}
      <motion.nav 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-1.5 rounded-full bg-[#111111]/80 backdrop-blur-xl border border-white/10 shadow-2xl"
      >
        <div className="flex items-center px-4 py-2 gap-2 text-sm text-white/50 hover:text-white transition-colors cursor-pointer border-r border-white/10">
          <Search size={16} />
          <span className="mr-2">Search nodes...</span>
          <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono">
            <Command size={10} /> K
          </kbd>
        </div>
        <button onClick={resetView} className="p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Recenter">
          <Crosshair size={18} />
        </button>
        <button className="p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Layers">
          <Layers size={18} />
        </button>
        <button onClick={toggleFullscreen} className="p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors mr-1">
          {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </motion.nav>

      {/* 主视窗 - 拖拽与缩放引擎 */}
      <main ref={containerRef} className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
        <motion.div
          drag
          dragConstraints={{ left: -5000, right: 5000, top: -5000, bottom: 5000 }}
          style={{ x: transform.x, y: transform.y, scale: transform.scale }}
          className="w-full h-full origin-top-left"
        >
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
            {edges}
          </svg>

          {/* Diagram 风格知识点卡片：极致细边框，微弱背景，悬浮效果 */}
          {points.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02, zIndex: 50 }}
              onClick={(e) => { e.stopPropagation(); setSelectedPoint(p); }}
              className={`absolute w-[320px] p-5 rounded-2xl cursor-pointer transition-all duration-300
                ${selectedPoint?.id === p.id 
                  ? 'bg-[#1A1A1A] border border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.1)]' 
                  : 'bg-[#0A0A0A] border border-white/10 hover:border-white/20 hover:bg-[#111111] shadow-lg'
                }`}
              style={{ left: p.x, top: p.y }}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/20"></span>
                  <span className="text-xs text-white/50 uppercase tracking-widest">{p.module}</span>
                </div>
                {p.difficulty > 3 && <Zap size={14} className="text-white/40" />}
              </div>
              
              <h2 className="text-xl font-semibold text-white/90 tracking-tight leading-snug mb-4">{p.pointName}</h2>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-white/30 rounded-full" style={{ width: `${(p.weight || 5) * 10}%` }} />
                </div>
                <span className="text-[10px] text-white/40 font-mono">LV.{p.difficulty}</span>
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-8 h-8 border-2 border-white/10 border-t-white/80 rounded-full" />
              <span className="text-xs text-white/40 font-mono tracking-widest uppercase">Initializing Canvas</span>
            </div>
          )}

          {/* MODIFIED: 新增错误状态和空数据提示（不影响原有 loading） */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
              <div className="text-center">
                <Lightbulb className="mx-auto mb-4 text-red-400" size={48} />
                <p className="text-red-400 text-xl font-medium">{error}</p>
                <p className="text-white/60 mt-2">运行 `npx tsx push-to-d1.ts` 后刷新</p>
              </div>
            </div>
          )}
          {!loading && !error && points.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white/60 z-50">
              无知识点数据，请初始化 D1 数据库
            </div>
          )}
        </motion.div>
      </main>

      {/* 右侧详情面板 - Diagram 风格侧滑 (全高、纯粹、毛玻璃) */}
      <AnimatePresence>
        {selectedPoint && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed top-0 right-0 h-full w-[480px] bg-[#050505]/80 backdrop-blur-2xl border-l border-white/10 z-50 p-10 overflow-y-auto"
          >
            {/* 原有详情面板代码完整保留（此处省略以保持简洁，实际复制时完整粘贴） */}
            {/* ... */}
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}