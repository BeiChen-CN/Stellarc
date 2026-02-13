import { GraduationCap, Github, Heart, Shield, Zap, Users, BarChart3, Palette, Keyboard, Globe, Monitor, Code2 } from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  { icon: Zap, title: '多种抽选动画', desc: '7 种抽选动画风格，流畅自然' },
  { icon: Shield, title: '隐私优先', desc: '所有数据存储在本地，不上传任何信息' },
  { icon: Users, title: '班级管理', desc: '支持多班级、学生照片、批量导入' },
  { icon: BarChart3, title: '统计分析', desc: '抽选频率、班级分布、趋势图表' },
  { icon: Palette, title: '高度可定制', desc: '18 种配色、9 种设计风格、深色模式' },
  { icon: Keyboard, title: '全局快捷键', desc: '自定义快捷键，一键触发抽选' },
  { icon: Globe, title: '公平算法', desc: 'Fisher-Yates 洗牌、加权随机、冷却机制' },
  { icon: Monitor, title: '跨平台', desc: '支持 Windows、macOS、Linux' },
]

const techStack = ['Electron', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Zustand', 'Recharts', 'Vite', 'shadcn/ui']

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } }
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } }
}

export function About() {
  return (
    <div className="min-h-full flex flex-col p-6 overflow-y-auto">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto w-full space-y-8"
      >
        {/* Hero */}
        <motion.div variants={fadeUp} className="text-center space-y-4 pt-4">
          <motion.div
            className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <GraduationCap className="w-10 h-10 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight">Stellarc</h1>
            <p className="text-on-surface-variant mt-1">智能课堂点名助手</p>
            <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full font-mono">
              v{__APP_VERSION__}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
            隐私优先、算法公平、高度可定制的离线课堂随机点名工具。
            基于 Electron + React + TypeScript 构建，为教师打造流畅的课堂互动。
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div variants={fadeUp}>
          <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            核心特性
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ scale: 1.02 }}
                className="bg-surface-container rounded-2xl p-4 flex items-start gap-3 transition-colors hover:bg-surface-container-high"
              >
                <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
                  <f.icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-on-surface">{f.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tech Stack */}
        <motion.div variants={fadeUp}>
          <h2 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            技术栈
          </h2>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech, i) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.08, y: -2 }}
                className="px-3 py-1.5 bg-surface-container-high text-on-surface-variant text-xs font-medium rounded-full transition-colors hover:bg-primary/10 hover:text-primary cursor-default"
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Links & Credits */}
        <motion.div variants={fadeUp} className="bg-surface-container rounded-2xl p-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => window.electronAPI.openExternal('https://github.com/BeiChen-CN/Stellarc')}
              className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <Github className="w-5 h-5" />
              GitHub 仓库
            </button>
            <button
              onClick={() => window.electronAPI.openExternal('https://github.com/BeiChen-CN/Stellarc/issues')}
              className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              反馈问题
            </button>
          </div>
          <div className="border-t border-outline-variant/30 pt-4">
            <p className="flex items-center justify-center gap-1.5 text-xs text-on-surface-variant/50">
              <Heart className="w-3 h-3" />
              Made with love by BeiChen-CN
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
