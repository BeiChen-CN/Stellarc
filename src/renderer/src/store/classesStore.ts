import { create } from 'zustand'

import { Student, ClassGroup } from '../types'
import { useToastStore } from './toastStore'
import { logger } from '../lib/logger'

interface ClassesState {
  classes: ClassGroup[]
  currentClassId: string | null
  undoStack: { classes: ClassGroup[]; currentClassId: string | null }[]
  canUndo: boolean
  addClass: (name: string) => void
  removeClass: (id: string) => void
  loadClasses: () => Promise<void>
  saveClasses: () => Promise<void>
  addStudent: (classId: string, student: Student) => void
  addStudents: (classId: string, students: Student[]) => void
  removeStudent: (classId: string, studentId: string) => void
  setCurrentClass: (id: string) => void
  updateStudentStatus: (
    classId: string,
    studentId: string,
    status: 'active' | 'absent' | 'excluded'
  ) => void
  updateStudentWeight: (classId: string, studentId: string, weight: number) => void
  updateStudentScore: (classId: string, studentId: string, score: number) => void
  updateStudentPhoto: (classId: string, studentId: string, photo: string | undefined) => void
  updateStudentName: (classId: string, studentId: string, name: string) => void
  updateStudentId: (classId: string, studentId: string, studentId2: string | undefined) => void
  incrementPickCount: (classId: string, studentId: string) => void
  renameClass: (classId: string, name: string) => void
  duplicateClass: (classId: string) => void
  resetClassScores: (classId: string) => void
  undoLastChange: () => void
}

export const useClassesStore = create<ClassesState>((set, get) => ({
  classes: [],
  currentClassId: null,
  undoStack: [],
  canUndo: false,

  undoLastChange: () => {
    const { undoStack } = get()
    if (undoStack.length === 0) return

    const previous = undoStack[undoStack.length - 1]
    set({
      classes: previous.classes,
      currentClassId: previous.currentClassId,
      undoStack: undoStack.slice(0, -1),
      canUndo: undoStack.length > 1
    })
    get().saveClasses()
  },

  loadClasses: async () => {
    try {
      const data = await window.electronAPI.readJson('classes.json') as Record<string, unknown> | unknown[] | null
      if (Array.isArray(data)) {
        // Handle migration or direct array format
        set({
          classes: data as ClassGroup[],
          currentClassId: data.length > 0 ? (data[0] as ClassGroup).id : null,
          undoStack: [],
          canUndo: false
        })
      } else if (data && Array.isArray((data as Record<string, unknown>).classes)) {
        const obj = data as { classes: ClassGroup[]; currentClassId?: string | null }
        set({
          classes: obj.classes,
          currentClassId:
            obj.currentClassId || (obj.classes.length > 0 ? obj.classes[0].id : null),
          undoStack: [],
          canUndo: false
        })
      }
    } catch (e) {
      logger.error('ClassesStore', 'Failed to load classes', e)
    }
  },

  saveClasses: async () => {
    try {
      const { classes, currentClassId } = get()
      // Save in legacy format to maintain compatibility and persist selection
      await window.electronAPI.writeJson('classes.json', { classes, currentClassId })
    } catch (e) {
      logger.error('ClassesStore', 'Failed to save classes', e)
      useToastStore.getState().addToast('班级数据保存失败，请检查磁盘空间', 'error')
    }
  },

  addClass: (name) => {
    const newClass: ClassGroup = {
      id: crypto.randomUUID(),
      name,
      students: []
    }
    set((state) => ({
      classes: [...state.classes, newClass],
      currentClassId: newClass.id,
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  },

  removeClass: (id) => {
    set((state) => {
      const remaining = state.classes.filter((c) => c.id !== id)
      return {
        classes: remaining,
        currentClassId:
          state.currentClassId === id
            ? remaining.length > 0
              ? remaining[0].id
              : null
            : state.currentClassId,
        undoStack: [
          ...state.undoStack.slice(-19),
          { classes: state.classes, currentClassId: state.currentClassId }
        ],
        canUndo: true
      }
    })
    get().saveClasses()
  },

  addStudent: (classId, student) => {
    if (!student.name || !student.name.trim()) return
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId ? { ...c, students: [...c.students, student] } : c
      ),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  },

  addStudents: (classId, students) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId ? { ...c, students: [...c.students, ...students] } : c
      ),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  },

  removeStudent: (classId, studentId) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId ? { ...c, students: c.students.filter((s) => s.id !== studentId) } : c
      ),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  },

  setCurrentClass: (id) => {
    set({ currentClassId: id })
    get().saveClasses()
  },

  incrementPickCount: (classId, studentId) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? {
              ...c,
              students: c.students.map((s) =>
                s.id === studentId
                  ? {
                      ...s,
                      pickCount: (s.pickCount || 0) + 1,
                      lastPickedAt: new Date().toISOString()
                    }
                  : s
              )
            }
          : c
      )
    }))
    get().saveClasses()
  },

  updateStudentStatus: (classId, studentId, status) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? {
              ...c,
              students: c.students.map((s) => (s.id === studentId ? { ...s, status } : s))
            }
          : c
      ),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  },

  updateStudentWeight: (classId, studentId, weight) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? {
              ...c,
              students: c.students.map((s) => (s.id === studentId ? { ...s, weight } : s))
            }
          : c
      ),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  },

  updateStudentScore: (classId, studentId, score) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? {
              ...c,
              students: c.students.map((s) => (s.id === studentId ? { ...s, score } : s))
            }
          : c
      ),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  },

  updateStudentPhoto: (classId, studentId, photo) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? {
              ...c,
              students: c.students.map((s) => (s.id === studentId ? { ...s, photo } : s))
            }
          : c
      ),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  },

  updateStudentName: (classId, studentId, name) => {
    if (!name.trim()) return
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? { ...c, students: c.students.map((s) => (s.id === studentId ? { ...s, name: name.trim() } : s)) }
          : c
      ),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  },

  updateStudentId: (classId, studentId, newStudentId) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? { ...c, students: c.students.map((s) => (s.id === studentId ? { ...s, studentId: newStudentId?.trim() || undefined } : s)) }
          : c
      ),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  },

  renameClass: (classId, name) => {
    if (!name.trim()) return
    set((state) => ({
      classes: state.classes.map((c) => (c.id === classId ? { ...c, name: name.trim() } : c)),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  },

  duplicateClass: (classId) => {
    const source = get().classes.find((c) => c.id === classId)
    if (!source) return
    const newClass: ClassGroup = {
      id: crypto.randomUUID(),
      name: source.name + '（副本）',
      students: source.students.map((s) => ({
        ...s,
        id: crypto.randomUUID(),
        pickCount: 0,
        score: 0,
        lastPickedAt: undefined
      }))
    }
    set((state) => ({
      classes: [...state.classes, newClass],
      currentClassId: newClass.id,
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  },

  resetClassScores: (classId) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? { ...c, students: c.students.map((s) => ({ ...s, score: 0 })) }
          : c
      ),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  }
}))
