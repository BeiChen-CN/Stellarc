/**
 * 主进程与 preload 共享的类型定义。
 * 放在独立目录避免 preload 反向依赖 main 内部模块。
 */

export type ImmersiveWindowPhase = 'normal' | 'ball' | 'menu' | 'island' | 'expanded'

export interface ImmersiveWindowPhaseOptions {
  anchor?: { x: number; y: number }
}
