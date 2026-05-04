import { describe, expect, it } from 'vitest'

import { parseStudentImportRows } from './studentImport'

describe('parseStudentImportRows', () => {
  it('parses plain name lists into active students', () => {
    expect(parseStudentImportRows('Alice\nBob')).toEqual([
      { name: 'Alice', weight: 1, score: 0, status: 'active' },
      { name: 'Bob', weight: 1, score: 0, status: 'active' }
    ])
  })

  it('parses tabular student data with headers and normalizes values', () => {
    expect(
      parseStudentImportRows(
        [
          'name,studentId,gender,weight,score,status',
          'Alice,1001,female,2,5,active',
          'Bob,1002,male,0,-3,absent'
        ].join('\n')
      )
    ).toEqual([
      {
        name: 'Alice',
        studentId: '1001',
        gender: 'female',
        weight: 2,
        score: 5,
        status: 'active'
      },
      {
        name: 'Bob',
        studentId: '1002',
        gender: 'male',
        weight: 1,
        score: -3,
        status: 'absent'
      }
    ])
  })
})
