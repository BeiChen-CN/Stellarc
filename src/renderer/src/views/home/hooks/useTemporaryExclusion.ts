import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction
} from 'react'
import type { Student } from '../../../types'

const TEMP_EXCLUSION_STORAGE_KEY = 'home-temporary-exclusion-by-class'

export function useTemporaryExclusion({
  currentClass,
  currentClassId,
  effectivePickGenderFilter
}: {
  currentClass: { id: string; students: Student[] } | undefined
  currentClassId: string | null
  effectivePickGenderFilter: 'all' | 'male' | 'female'
}): {
  excludedMenuOpen: boolean
  setExcludedMenuOpen: Dispatch<SetStateAction<boolean>>
  excludedSearch: string
  setExcludedSearch: Dispatch<SetStateAction<string>>
  excludedOnly: boolean
  setExcludedOnly: Dispatch<SetStateAction<boolean>>
  manualExcludedIds: string[]
  manualExcludedSet: Set<string>
  excludedMenuRef: MutableRefObject<HTMLDivElement | null>
  filteredExcludedCandidates: Student[]
  pickRangeEligibleCount: number
  updateManualExcludedIds: (nextIds: string[]) => void
  hydrateForClass: (classId: string, students: Student[]) => void
} {
  const [excludedMenuOpen, setExcludedMenuOpen] = useState(false)
  const [excludedSearch, setExcludedSearch] = useState('')
  const [excludedOnly, setExcludedOnly] = useState(false)
  const [manualExcludedIds, setManualExcludedIds] = useState<string[]>([])
  const [classExcludedMap, setClassExcludedMap] = useState<Record<string, string[]>>(() => {
    try {
      const raw = localStorage.getItem(TEMP_EXCLUSION_STORAGE_KEY)
      if (!raw) return {}
      const parsed = JSON.parse(raw) as Record<string, string[]>
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  })
  const excludedMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(TEMP_EXCLUSION_STORAGE_KEY, JSON.stringify(classExcludedMap))
    } catch {
      // ignore localStorage write errors
    }
  }, [classExcludedMap])

  useEffect(() => {
    if (!excludedMenuOpen) return
    const onMouseDown = (event: MouseEvent): void => {
      if (!excludedMenuRef.current) return
      if (!excludedMenuRef.current.contains(event.target as Node)) {
        setExcludedMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [excludedMenuOpen])

  const updateManualExcludedIds = (nextIds: string[]): void => {
    const normalized = Array.from(new Set(nextIds))
    setManualExcludedIds(normalized)
    if (!currentClassId) return
    setClassExcludedMap((prev) => ({
      ...prev,
      [currentClassId]: normalized
    }))
  }

  const hydrateForClass = (classId: string, students: Student[]): void => {
    setExcludedMenuOpen(false)
    const validIds = new Set(students.map((student) => student.id))
    const persisted = classExcludedMap[classId] || []
    setManualExcludedIds(persisted.filter((id) => validIds.has(id)))
  }

  const manualExcludedSet = useMemo(() => new Set(manualExcludedIds), [manualExcludedIds])

  const filteredExcludedCandidates = useMemo(() => {
    const list = (currentClass?.students || []).filter((student) => {
      if (student.status !== 'active') return false
      if (effectivePickGenderFilter === 'all') return true
      return student.gender === effectivePickGenderFilter
    })
    const query = excludedSearch.trim().toLowerCase()
    return list.filter((student) => {
      if (excludedOnly && !manualExcludedSet.has(student.id)) {
        return false
      }
      if (!query) {
        return true
      }
      return (
        student.name.toLowerCase().includes(query) ||
        (student.studentId || '').toLowerCase().includes(query)
      )
    })
  }, [currentClass, effectivePickGenderFilter, excludedOnly, excludedSearch, manualExcludedSet])

  const pickRangeEligibleCount = useMemo(() => {
    if (!currentClass) return 0
    return currentClass.students.filter((student) => {
      if (student.status !== 'active') return false
      if (manualExcludedSet.has(student.id)) return false
      if (effectivePickGenderFilter === 'all') return true
      return student.gender === effectivePickGenderFilter
    }).length
  }, [currentClass, manualExcludedSet, effectivePickGenderFilter])

  return {
    excludedMenuOpen,
    setExcludedMenuOpen,
    excludedSearch,
    setExcludedSearch,
    excludedOnly,
    setExcludedOnly,
    manualExcludedIds,
    manualExcludedSet,
    excludedMenuRef,
    filteredExcludedCandidates,
    pickRangeEligibleCount,
    updateManualExcludedIds,
    hydrateForClass
  }
}
