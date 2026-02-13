import { create } from 'zustand'

interface ConfirmState {
  open: boolean
  title: string
  message: string
  onConfirm: (() => void) | null
  show: (title: string, message: string, onConfirm: () => void) => void
  close: () => void
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  open: false,
  title: '',
  message: '',
  onConfirm: null,
  show: (title, message, onConfirm) => set({ open: true, title, message, onConfirm }),
  close: () => set({ open: false, title: '', message: '', onConfirm: null })
}))
