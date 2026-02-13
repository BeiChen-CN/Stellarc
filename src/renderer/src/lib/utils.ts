import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toFileUrl(input: string): string {
  if (!input) {
    return input
  }

  if (input.startsWith('file://')) {
    return input
  }

  const normalized = input.replace(/\\/g, '/')
  const isWindowsAbs = /^[a-zA-Z]:\//.test(normalized)
  const isUnixAbs = normalized.startsWith('/')

  if (isWindowsAbs || isUnixAbs) {
    return encodeURI(`file://${normalized}`)
  }

  return input
}
