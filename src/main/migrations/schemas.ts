import { z } from 'zod/v4'

const statusSchema = z.enum(['active', 'absent', 'excluded'])

export const studentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  studentId: z.string().optional(),
  tags: z.array(z.string().min(1)).optional(),
  photo: z.string().optional(),
  pickCount: z.number().int().nonnegative().default(0),
  score: z.number().int().default(0),
  scoreHistory: z
    .array(
      z.object({
        id: z.string().min(1),
        timestamp: z.string().min(1),
        delta: z.number().int(),
        taskName: z.string().min(1),
        source: z.enum(['manual', 'task-assignment', 'batch'])
      })
    )
    .optional(),
  weight: z.number().positive().default(1),
  status: statusSchema.default('active'),
  lastPickedAt: z.string().optional()
})

export const classGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  students: z.array(studentSchema).default([]),
  taskTemplates: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        scoreDelta: z.number().int()
      })
    )
    .optional()
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
  eventType: z.enum(['pick', 'group', 'task']).optional(),
  pickedStudents: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      studentId: z.string().optional()
    })
  ),
  groupSummary: z
    .object({
      groupCount: z.number().int().min(1),
      groups: z.array(
        z.object({
          groupIndex: z.number().int().min(1),
          studentIds: z.array(z.string().min(1)).default([]),
          studentNames: z.array(z.string().min(1)).default([]),
          taskTemplateId: z.string().optional(),
          taskName: z.string().optional(),
          taskScoreDelta: z.number().int().optional()
        })
      )
    })
    .optional(),
  taskSummary: z
    .object({
      taskName: z.string().min(1),
      scoreDelta: z.number().int(),
      studentIds: z.array(z.string().min(1)).default([]),
      studentNames: z.array(z.string().min(1)).default([]),
      source: z.enum(['manual', 'task-assignment', 'batch'])
    })
    .optional(),
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
  strategyPreset: z.string().min(1).default('classic'),
  balanceByTerm: z.boolean().default(false),
  stageFairnessRounds: z.number().int().min(0).default(0),
  prioritizeUnpickedCount: z.number().int().min(0).default(0),
  groupStrategy: z.enum(['random', 'balanced-score']).default('random'),
  pairAvoidRounds: z.number().int().min(0).default(0),
  autoRelaxOnConflict: z.boolean().default(true)
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
  showClassroomFlow: z.boolean().default(false),
  showClassroomTemplate: z.boolean().default(false),
  showTemporaryExclusion: z.boolean().default(false),
  showAutoDraw: z.boolean().default(false),
  showSelectionExplanation: z.boolean().default(false),
  revealSettleMs: z.number().int().min(0).max(5000).default(900),
  syncEnabled: z.boolean().default(false),
  syncFolder: z.string().optional(),
  animationStyle: z.string().default('slot'),
  dynamicColor: z.boolean().default(false),
  fairness: fairnessSchema.default({
    weightedRandom: false,
    preventRepeat: false,
    cooldownRounds: 0,
    strategyPreset: 'classic',
    balanceByTerm: false,
    stageFairnessRounds: 0,
    prioritizeUnpickedCount: 0,
    groupStrategy: 'random',
    pairAvoidRounds: 0,
    autoRelaxOnConflict: true
  }),
  pickCount: z.number().int().min(1).default(1),
  maxHistoryRecords: z.number().int().min(100).default(1000),
  shortcutKey: z.string().default(''),
  ruleTemplates: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        pickCount: z.number().int().min(1).max(10),
        animationStyle: z.string().min(1),
        fairness: fairnessSchema,
        groupTaskTemplates: z
          .array(
            z.object({
              id: z.string().min(1),
              name: z.string().min(1),
              scoreDelta: z.number().int()
            })
          )
          .optional(),
        createdAt: z.string().min(1),
        updatedAt: z.string().min(1)
      })
    )
    .default([]),
  scoreRules: z
    .object({
      maxScorePerStudent: z.number().int().default(100),
      minScorePerStudent: z.number().int().default(-50),
      maxDeltaPerOperation: z.number().int().min(1).default(20),
      preventDuplicateTaskPerDay: z.boolean().default(true)
    })
    .default({
      maxScorePerStudent: 100,
      minScorePerStudent: -50,
      maxDeltaPerOperation: 20,
      preventDuplicateTaskPerDay: true
    })
})

export type ClassesV2 = z.infer<typeof classesV2Schema>
export type HistoryV2 = z.infer<typeof historyV2Schema>
export type SettingsV2 = z.infer<typeof settingsV2Schema>
