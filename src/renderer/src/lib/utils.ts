import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toFileUrl(input: string): string {
  if (!input) {
    return input
  }

  if (input.startsWith('local-file://') || input.startsWith('file://')) {
    return input
  }

  const normalized = input.replace(/\\/g, '/')
  return `local-file://${encodeURIComponent(normalized)}`
}

/** 把「标签A / 标签B」形式的输入切分为去空白的标签数组 */
export function splitTagInput(input: string): string[] {
  return input
    .split('/')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}
