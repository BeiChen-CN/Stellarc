import type { ClassGroup } from '@renderer/types'
import type { HistoryRecord } from '@renderer/store/historyStore'

import type { GroupRequest, SelectionPolicy, SelectionRequest } from './types'

export function buildPickRequest(input: {
  currentClass: ClassGroup
  history: HistoryRecord[]
  policy: SelectionPolicy
  count: number
}): SelectionRequest {
  const { currentClass, history, policy, count } = input
  return {
    mode: 'pick',
    classId: currentClass.id,
    className: currentClass.name,
    candidates: currentClass.students.map((student) => ({
      ...student,
      classId: currentClass.id,
      className: currentClass.name
    })),
    history: history.map((record) => ({
      id: record.id,
      timestamp: record.timestamp,
      classId: record.classId,
      pickedStudents: record.pickedStudents
    })),
    count,
    policy
  }
}

export function buildGroupRequest(input: {
  currentClass: ClassGroup
  history: HistoryRecord[]
  policy: SelectionPolicy
  groupCount: number
}): GroupRequest {
  const { currentClass, history, policy, groupCount } = input
  return {
    mode: 'group',
    classId: currentClass.id,
    className: currentClass.name,
    candidates: currentClass.students.map((student) => ({
      ...student,
      classId: currentClass.id,
      className: currentClass.name
    })),
    history: history.map((record) => ({
      id: record.id,
      timestamp: record.timestamp,
      classId: record.classId,
      pickedStudents: record.pickedStudents
    })),
    groupCount,
    policy
  }
}
