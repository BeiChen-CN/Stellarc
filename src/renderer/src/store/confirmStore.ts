import { create } from 'zustand'

interface ConfirmState {
  open: boolean
  title: string
  message: string
  onConfirm: (() => void) | null
  /** prompt mode: show an input field and pass the value to onPromptConfirm */
  promptMode: boolean
  promptPlaceholder: string
  onPromptConfirm: ((value: string) => void) | null
  show: (title: string, message: string, onConfirm: () => void) => void
  showPrompt: (title: string, message: string, placeholder: string, onConfirm: (value: string) => void) => void
  close: () => void
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  open: false,
  title: '',
  message: '',
  onConfirm: null,
  promptMode: false,
  promptPlaceholder: '',
  onPromptConfirm: null,
  show: (title, message, onConfirm) =>
    set({ open: true, title, message, onConfirm, promptMode: false, onPromptConfirm: null }),
  showPrompt: (title, message, placeholder, onConfirm) =>
    set({ open: true, title, message, promptMode: true, promptPlaceholder: placeholder, onPromptConfirm: onConfirm, onConfirm: null }),
  close: () =>
    set({ open: false, title: '', message: '', onConfirm: null, promptMode: false, promptPlaceholder: '', onPromptConfirm: null })
}))
