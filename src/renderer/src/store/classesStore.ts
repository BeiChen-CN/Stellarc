import { create } from 'zustand'

import { Student, ClassGroup, ClassTaskTemplate, ScoreLogEntry } from '../types'
import { useToastStore } from './toastStore'
import { useSettingsStore } from './settingsStore'
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
  updateStudentGender: (
    classId: string,
    studentId: string,
    gender: 'male' | 'female' | undefined
  ) => void
  updateStudentTags: (classId: string, studentId: string, tags: string[]) => void
  batchUpdateStudents: (
    classId: string,
    studentIds: string[],
    patch: {
      gender?: 'male' | 'female'
      status?: 'active' | 'absent' | 'excluded'
      weight?: number
      tags?: string[]
      tagsMode?: 'replace' | 'append'
    }
  ) => { affected: number }
  setClassTaskTemplates: (classId: string, templates: ClassTaskTemplate[]) => void
  applyTaskScore: (
    classId: string,
    studentIds: string[],
    taskName: string,
    delta: number,
    source?: 'manual' | 'task-assignment' | 'batch'
  ) => { affected: number }
  rollbackScoreLog: (
    classId: string,
    studentId: string,
    logId: string
  ) => { ok: boolean; message: string }
  incrementPickCount: (classId: string, studentId: string) => void
  renameClass: (classId: string, name: string) => void
  duplicateClass: (classId: string) => void
  resetClassScores: (classId: string) => void
  dedupeClassStudents: (classId: string) => { removed: number }
  normalizeClassStudents: (classId: string) => { updated: number; removed: number }
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
      const data = (await window.electronAPI.readJson('classes.json')) as
        | Record<string, unknown>
        | unknown[]
        | null
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
          currentClassId: obj.currentClassId || (obj.classes.length > 0 ? obj.classes[0].id : null),
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
    const nextScore = Math.trunc(score)
    const scoreRules = useSettingsStore.getState().scoreRules
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? {
              ...c,
              students: c.students.map((s) => {
                if (s.id !== studentId) return s
                const delta = nextScore - (s.score || 0)
                if (delta === 0) return s
                const limitedDelta = Math.max(
                  -scoreRules.maxDeltaPerOperation,
                  Math.min(scoreRules.maxDeltaPerOperation, delta)
                )
                const nextFinalScore = Math.max(
                  scoreRules.minScorePerStudent,
                  Math.min(scoreRules.maxScorePerStudent, (s.score || 0) + limitedDelta)
                )
                const appliedDelta = nextFinalScore - (s.score || 0)
                if (appliedDelta === 0) return s
                const log: ScoreLogEntry = {
                  id: crypto.randomUUID(),
                  timestamp: new Date().toISOString(),
                  delta: appliedDelta,
                  taskName: '手动调整',
                  source: 'manual'
                }
                return {
                  ...s,
                  score: nextFinalScore,
                  scoreHistory: [log, ...(s.scoreHistory || [])].slice(0, 100)
                }
              })
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
          ? {
              ...c,
              students: c.students.map((s) =>
                s.id === studentId ? { ...s, name: name.trim() } : s
              )
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

  updateStudentId: (classId, studentId, newStudentId) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? {
              ...c,
              students: c.students.map((s) =>
                s.id === studentId ? { ...s, studentId: newStudentId?.trim() || undefined } : s
              )
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

  updateStudentGender: (classId, studentId, gender) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? {
              ...c,
              students: c.students.map((s) => (s.id === studentId ? { ...s, gender } : s))
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

  updateStudentTags: (classId, studentId, tags) => {
    const cleaned = tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .slice(0, 10)
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? {
              ...c,
              students: c.students.map((s) =>
                s.id === studentId ? { ...s, tags: cleaned.length > 0 ? cleaned : undefined } : s
              )
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

  batchUpdateStudents: (classId, studentIds, patch) => {
    const targetIds = new Set(studentIds)
    const cleanTags = (patch.tags || [])
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .slice(0, 10)
    let affected = 0
    set((state) => ({
      classes: state.classes.map((c) => {
        if (c.id !== classId) return c
        return {
          ...c,
          students: c.students.map((s) => {
            if (!targetIds.has(s.id)) return s
            const nextTags =
              patch.tagsMode === 'append'
                ? Array.from(new Set([...(s.tags || []), ...cleanTags])).slice(0, 10)
                : cleanTags.length > 0
                  ? cleanTags
                  : s.tags
            const next = {
              ...s,
              gender: patch.gender ?? s.gender,
              status: patch.status ?? s.status,
              weight:
                typeof patch.weight === 'number' && Number.isFinite(patch.weight)
                  ? Math.max(1, Math.trunc(patch.weight))
                  : s.weight,
              tags: nextTags
            }
            const changed =
              next.gender !== s.gender ||
              next.status !== s.status ||
              next.weight !== s.weight ||
              JSON.stringify(next.tags || []) !== JSON.stringify(s.tags || [])
            if (changed) affected++
            return next
          })
        }
      }),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
    return { affected }
  },

  setClassTaskTemplates: (classId, templates) => {
    const cleaned = templates
      .map((template) => ({
        id: template.id,
        name: template.name.trim(),
        scoreDelta: Math.trunc(template.scoreDelta)
      }))
      .filter((template) => template.name.length > 0)
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === classId
          ? {
              ...c,
              taskTemplates: cleaned.length > 0 ? cleaned : undefined
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

  applyTaskScore: (classId, studentIds, taskName, delta, source = 'manual') => {
    const targetIds = new Set(studentIds)
    const safeTaskName = taskName.trim() || '任务积分'
    const normalizedTaskName = safeTaskName.toLowerCase()
    const scoreRules = useSettingsStore.getState().scoreRules
    const blockedSet = new Set((scoreRules.blockedTasks || []).map((item) => item.toLowerCase()))
    const allowRepeatSet = new Set(
      (scoreRules.allowRepeatTasks || []).map((item) => item.toLowerCase())
    )
    if (blockedSet.has(normalizedTaskName)) {
      return { affected: 0 }
    }
    const now = new Date().toISOString()
    const today = now.slice(0, 10)
    let affected = 0
    set((state) => ({
      classes: state.classes.map((c) => {
        if (c.id !== classId) return c
        return {
          ...c,
          students: c.students.map((s) => {
            if (!targetIds.has(s.id)) return s
            const sameTaskTodayCount = (s.scoreHistory || []).filter(
              (entry) =>
                entry.taskName.toLowerCase() === normalizedTaskName &&
                entry.timestamp.slice(0, 10) === today
            ).length
            const canRepeatToday = allowRepeatSet.has(normalizedTaskName)
            if (
              scoreRules.preventDuplicateTaskPerDay &&
              !canRepeatToday &&
              sameTaskTodayCount > 0
            ) {
              return s
            }
            if (sameTaskTodayCount >= (scoreRules.taskDailyLimitPerStudent || 1)) {
              return s
            }
            const limitedDelta = Math.max(
              -scoreRules.maxDeltaPerOperation,
              Math.min(scoreRules.maxDeltaPerOperation, delta)
            )
            const nextScore = Math.max(
              scoreRules.minScorePerStudent,
              Math.min(scoreRules.maxScorePerStudent, s.score + limitedDelta)
            )
            const appliedDelta = nextScore - s.score
            if (appliedDelta === 0) return s
            affected++
            const log: ScoreLogEntry = {
              id: crypto.randomUUID(),
              timestamp: now,
              delta: appliedDelta,
              taskName: safeTaskName,
              source
            }
            return {
              ...s,
              score: nextScore,
              scoreHistory: [log, ...(s.scoreHistory || [])].slice(0, 100)
            }
          })
        }
      }),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
    return { affected }
  },

  rollbackScoreLog: (classId, studentId, logId) => {
    let success = false
    let message = '未找到可回滚记录'
    set((state) => ({
      classes: state.classes.map((c) => {
        if (c.id !== classId) return c
        return {
          ...c,
          students: c.students.map((s) => {
            if (s.id !== studentId) return s
            const logs = s.scoreHistory || []
            const target = logs.find((entry) => entry.id === logId)
            if (!target) return s
            success = true
            const nextScore = s.score - target.delta
            const rollbackLog: ScoreLogEntry = {
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
              delta: -target.delta,
              taskName: `回滚:${target.taskName}`,
              source: 'manual'
            }
            message = '回滚成功'
            return {
              ...s,
              score: nextScore,
              scoreHistory: [rollbackLog, ...logs.filter((entry) => entry.id !== logId)].slice(
                0,
                100
              )
            }
          })
        }
      }),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    if (success) {
      get().saveClasses()
    }
    return { ok: success, message }
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
        scoreHistory: [],
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
        c.id === classId ? { ...c, students: c.students.map((s) => ({ ...s, score: 0 })) } : c
      ),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
  },

  dedupeClassStudents: (classId) => {
    let removed = 0
    set((state) => ({
      classes: state.classes.map((c) => {
        if (c.id !== classId) return c
        const seen = new Set<string>()
        const deduped = c.students.filter((student) => {
          const key = `${student.name.trim().toLowerCase()}::${(student.studentId || '').trim().toLowerCase()}`
          if (seen.has(key)) {
            removed++
            return false
          }
          seen.add(key)
          return true
        })
        return { ...c, students: deduped }
      }),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
    return { removed }
  },

  normalizeClassStudents: (classId) => {
    let updated = 0
    let removed = 0
    set((state) => ({
      classes: state.classes.map((c) => {
        if (c.id !== classId) return c
        const normalized: Student[] = []
        c.students.forEach((student) => {
          const name = student.name.trim()
          if (!name) {
            removed++
            return
          }

          const next = {
            ...student,
            name,
            weight: Number.isFinite(student.weight) && student.weight > 0 ? student.weight : 1,
            score: Number.isFinite(student.score) ? student.score : 0,
            pickCount:
              Number.isFinite(student.pickCount) && student.pickCount >= 0 ? student.pickCount : 0,
            status: student.status || 'active',
            studentId: student.studentId?.trim() || undefined,
            gender:
              student.gender === 'male' || student.gender === 'female' ? student.gender : undefined,
            tags: (student.tags || []).map((tag) => tag.trim()).filter((tag) => tag.length > 0),
            scoreHistory: Array.isArray(student.scoreHistory)
              ? student.scoreHistory
                  .filter((entry) => entry && typeof entry.taskName === 'string')
                  .map((entry) => ({
                    id: entry.id || crypto.randomUUID(),
                    timestamp: entry.timestamp || new Date().toISOString(),
                    delta: Math.trunc(entry.delta || 0),
                    taskName: entry.taskName.trim() || '任务积分',
                    source:
                      entry.source === 'manual' ||
                      entry.source === 'task-assignment' ||
                      entry.source === 'batch'
                        ? entry.source
                        : 'manual'
                  }))
                  .slice(0, 100)
              : undefined
          }
          if (
            next.name !== student.name ||
            next.weight !== student.weight ||
            next.score !== student.score ||
            next.pickCount !== student.pickCount ||
            next.studentId !== student.studentId
          ) {
            updated++
          }
          normalized.push(next)
        })
        return { ...c, students: normalized }
      }),
      undoStack: [
        ...state.undoStack.slice(-19),
        { classes: state.classes, currentClassId: state.currentClassId }
      ],
      canUndo: true
    }))
    get().saveClasses()
    return { updated, removed }
  }
}))
