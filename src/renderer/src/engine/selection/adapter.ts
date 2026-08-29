import type { ClassGroup } from '@renderer/types'
import type { HistoryRecord } from '@renderer/store/historyStore'

import type { GroupRequest, SelectionPolicy, SelectionRequest } from './types'

interface RequestInput {
  currentClass: ClassGroup
  history: HistoryRecord[]
  policy: SelectionPolicy
}

function buildRequestBase(input: RequestInput) {
  const { currentClass, history } = input
  return {
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
    }))
  }
}

export function buildPickRequest(input: RequestInput & { count: number }): SelectionRequest {
  return {
    mode: 'pick',
    ...buildRequestBase(input),
    count: input.count,
    policy: input.policy
  }
}

export function buildGroupRequest(input: RequestInput & { groupCount: number }): GroupRequest {
  return {
    mode: 'group',
    ...buildRequestBase(input),
    groupCount: input.groupCount,
    policy: input.policy
  }
}
