import { z } from 'zod/v4'

const statusSchema = z.enum(['active', 'absent', 'excluded'])

export const studentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  studentId: z.string().optional(),
  photo: z.string().optional(),
  pickCount: z.number().int().nonnegative().default(0),
  score: z.number().int().default(0),
  weight: z.number().positive().default(1),
  status: statusSchema.default('active'),
  lastPickedAt: z.string().optional()
})

export const classGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  students: z.array(studentSchema).default([])
})

export const classesV2Schema = z.object({
  _meta: z
    .object({
      schemaVersion: z.number().int().min(2),
      migratedAt: z.string(),
      appVersion: z.string()
    })
    .optional(),
  classes: z.array(classGroupSchema).default([]),
  currentClassId: z.string().nullable().default(null)
})

export const historyRecordSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().min(1),
  classId: z.string().min(1),
  className: z.string().min(1),
  pickedStudents: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      studentId: z.string().optional()
    })
  ),
  selectionMeta: z.unknown().optional()
})

export const historyV2Schema = z.object({
  _meta: z
    .object({
      schemaVersion: z.number().int().min(2),
      migratedAt: z.string(),
      appVersion: z.string()
    })
    .optional(),
  records: z.array(historyRecordSchema).default([])
})

export const fairnessSchema = z.object({
  weightedRandom: z.boolean().default(false),
  preventRepeat: z.boolean().default(false),
  cooldownRounds: z.number().int().min(0).default(0),
  strategyPreset: z.string().min(1).default('classic')
})

export const settingsV2Schema = z.object({
  _meta: z
    .object({
      schemaVersion: z.number().int().min(2),
      migratedAt: z.string(),
      appVersion: z.string()
    })
    .optional(),
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  colorTheme: z.string().default('blue'),
  designStyle: z.string().default('material-design-3'),
  showStudentId: z.boolean().default(true),
  photoMode: z.boolean().default(true),
  soundEnabled: z.boolean().default(true),
  confettiEnabled: z.boolean().default(true),
  m3Mode: z.boolean().default(false),
  backgroundImage: z.string().optional(),
  projectorMode: z.boolean().default(false),
  activityPreset: z.enum(['quick-pick', 'deep-focus', 'group-battle']).default('quick-pick'),
  syncEnabled: z.boolean().default(false),
  syncFolder: z.string().optional(),
  animationStyle: z.string().default('slot'),
  dynamicColor: z.boolean().default(false),
  fairness: fairnessSchema.default({
    weightedRandom: false,
    preventRepeat: false,
    cooldownRounds: 0,
    strategyPreset: 'classic'
  }),
  pickCount: z.number().int().min(1).default(1),
  maxHistoryRecords: z.number().int().min(100).default(1000),
  shortcutKey: z.string().default('')
})

export type ClassesV2 = z.infer<typeof classesV2Schema>
export type HistoryV2 = z.infer<typeof historyV2Schema>
export type SettingsV2 = z.infer<typeof settingsV2Schema>
