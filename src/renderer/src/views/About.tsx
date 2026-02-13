import {
  GraduationCap, Github, Heart, Shield, Zap, Users, BarChart3,
  Palette, Keyboard, Globe, Monitor, Code2, Sparkles, BookOpen,
  Clock, Layers, Camera, FileDown, Type, ImageIcon, ExternalLink
} from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  { icon: Zap, title: '8 种抽选动画', desc: '老虎机、翻转、转盘、逐字揭晓等' },
  { icon: Shield, title: '隐私优先', desc: '数据完全离线，不上传任何信息' },
  { icon: Users, title: '班级管理', desc: '多班级、照片、批量导入导出、复制' },
  { icon: BarChart3, title: '统计分析', desc: '频率分布、趋势图表、课堂报告' },
  { icon: Palette, title: '高度可定制', desc: '28+ 配色、自定义颜色、9 种设计风格' },
  { icon: Keyboard, title: '全局快捷键', desc: '自定义快捷键，一键触发抽选' },
  { icon: Globe, title: '公平算法', desc: 'Fisher-Yates 洗牌 + 加权随机 + 冷却' },
  { icon: Monitor, title: '投屏模式', desc: '大字号高可读布局，适合教室大屏' },
  { icon: Sparkles, title: '丰富特效', desc: '五彩纸屑、音效反馈、动态取色' },
  { icon: BookOpen, title: '课堂预设', desc: '快速点名、深度互动、小组对抗' },
  { icon: Clock, title: '历史追溯', desc: '完整记录，搜索筛选、单条删除' },
  { icon: Camera, title: '头像展示', desc: '抽选结果展示学生照片' },
  { icon: FileDown, title: '数据导出', desc: '学生列表、统计数据 CSV 导出' },
  { icon: Type, title: '内联编辑', desc: '双击直接修改学生姓名与学号' },
  { icon: ImageIcon, title: '自定义背景', desc: '设置主页背景图片与动态取色' }
]

const techStack = [
  { name: 'Electron', desc: '跨平台桌面' },
  { name: 'React 18', desc: '声明式 UI' },
  { name: 'TypeScript', desc: '类型安全' },
  { name: 'Tailwind CSS', desc: '原子化样式' },
  { name: 'Framer Motion', desc: '流畅动画' },
  { name: 'Zustand', desc: '状态管理' },
  { name: 'Recharts', desc: '数据可视化' },
  { name: 'Vite', desc: '极速构建' },
  { name: 'shadcn/ui', desc: '组件系统' }
]

const highlights = [
  { value: '28+', label: '主题配色', icon: Palette },
  { value: '9', label: '设计风格', icon: Layers },
  { value: '8', label: '抽选动画', icon: Sparkles },
  { value: '3', label: '动画速率', icon: Zap }
]

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 0.68, 0, 1.04] as const } }
}

export function About() {
  return (
    <div className="h-full flex flex-col p-5 overflow-y-auto custom-scrollbar">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto w-full space-y-6 pb-8"
      >
        {/* Hero */}
        <motion.div variants={fadeUp} className="text-center space-y-4 pt-4">
          <motion.div
            className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto ring-1 ring-primary/10"
            whileHover={{ scale: 1.08, rotate: 3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <GraduationCap className="w-12 h-12 text-primary" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-on-surface tracking-tight">Stellarc</h1>
            <p className="text-on-surface-variant text-sm">智能课堂点名助手</p>
            <span className="inline-block mt-1 px-3.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full font-mono tracking-wide">
              v{__APP_VERSION__}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant/80 max-w-sm mx-auto leading-relaxed">
            隐私优先、算法公平、高度可定制的离线课堂随机点名工具。
            为教师打造流畅的课堂互动体验。
          </p>
        </motion.div>

        {/* Highlights */}
        <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3">
          {highlights.map((h) => (
            <motion.div
              key={h.label}
              whileHover={{ scale: 1.04, y: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="bg-surface-container rounded-2xl p-3.5 text-center group"
            >
              <h.icon className="w-4 h-4 text-primary/50 mx-auto mb-1.5 group-hover:text-primary transition-colors" />
              <div className="text-2xl font-black text-primary leading-none">{h.value}</div>
              <div className="text-[11px] text-on-surface-variant mt-1">{h.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <motion.div variants={fadeUp}>
          <h2 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2 uppercase tracking-wider">
            <div className="p-1 bg-primary/10 rounded-md">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            核心特性
          </h2>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-3 gap-2"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ scale: 1.02, y: -1 }}
                className="bg-surface-container rounded-xl p-3 flex items-start gap-2.5 transition-colors hover:bg-surface-container-high group"
              >
                <div className="p-1.5 bg-primary/10 text-primary rounded-lg shrink-0 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-on-surface leading-tight">{f.title}</h3>
                  <p className="text-[10px] text-on-surface-variant/70 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Tech Stack */}
        <motion.div variants={fadeUp}>
          <h2 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2 uppercase tracking-wider">
            <div className="p-1 bg-primary/10 rounded-md">
              <Code2 className="w-3.5 h-3.5 text-primary" />
            </div>
            技术栈
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            {techStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.04, duration: 0.3 }}
                whileHover={{ scale: 1.03 }}
                className="flex items-center gap-2.5 px-3 py-2 bg-surface-container rounded-xl transition-colors hover:bg-surface-container-high"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <div>
                  <span className="text-xs font-medium text-on-surface">{tech.name}</span>
                  <span className="text-[10px] text-on-surface-variant ml-1.5">{tech.desc}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Links & Credits */}
        <motion.div variants={fadeUp} className="bg-surface-container rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.electronAPI.openExternal('https://github.com/BeiChen-CN/Stellarc')}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-on-surface bg-surface-container-high rounded-full hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Github className="w-4 h-4" />
              GitHub 仓库
              <ExternalLink className="w-3 h-3 opacity-40" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.electronAPI.openExternal('https://github.com/BeiChen-CN/Stellarc/issues')}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-on-surface bg-surface-container-high rounded-full hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              反馈问题
              <ExternalLink className="w-3 h-3 opacity-40" />
            </motion.button>
          </div>
          <div className="border-t border-outline-variant/20 pt-3 text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs text-on-surface-variant/50">
              Made with
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <Heart className="w-3 h-3 text-rose-400" />
              </motion.span>
              by BeiChen-CN
            </p>
            <p className="text-[10px] text-on-surface-variant/30 mt-1">
              &copy; {new Date().getFullYear()} Stellarc. All rights reserved.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
