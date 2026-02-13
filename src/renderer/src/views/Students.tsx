import { useClassesStore } from '../store/classesStore'
import { useSettingsStore } from '../store/settingsStore'
import { useToastStore } from '../store/toastStore'
import { useConfirmStore } from '../store/confirmStore'
import {
  Plus,
  Trash2,
  UserX,
  CheckCircle,
  Upload,
  Minus,
  Users,
  Camera,
  RotateCcw
} from 'lucide-react'
import { useState } from 'react'
import { cn, toFileUrl } from '../lib/utils'
import { Student } from '../types'

function parseStudentImportRows(
  content: string
): Array<Pick<Student, 'name' | 'studentId' | 'weight' | 'score' | 'status'>> {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    return []
  }

  const detectDelimiter = (line: string) => {
    if (line.includes('\t')) return '\t'
    if (line.includes('，')) return '，'
    if (line.includes(',')) return ','
    return ''
  }

  const delimiter = detectDelimiter(lines[0])
  if (!delimiter) {
    return lines.map((name) => ({ name, weight: 1, score: 0, status: 'active' as const }))
  }

  const split = (line: string) => line.split(delimiter).map((cell) => cell.trim())
  const first = split(lines[0]).map((h) => h.toLowerCase())
  const hasHeader = first.some((h) =>
    [
      'name',
      '姓名',
      'studentid',
      '学号',
      'weight',
      '权重',
      'score',
      '积分',
      'status',
      '状态'
    ].includes(h)
  )

  const rows = hasHeader ? lines.slice(1) : lines
  const header = hasHeader ? first : ['name', 'studentId', 'weight', 'score', 'status']
  const indexOf = (keys: string[]) => header.findIndex((h) => keys.includes(h))

  const nameIdx = indexOf(['name', '姓名'])
  const studentIdIdx = indexOf(['studentid', '学号'])
  const weightIdx = indexOf(['weight', '权重'])
  const scoreIdx = indexOf(['score', '积分'])
  const statusIdx = indexOf(['status', '状态'])

  return rows
    .map((line) => split(line))
    .map((cells) => {
      const name = (nameIdx >= 0 ? cells[nameIdx] : cells[0]) || ''
      const studentId = studentIdIdx >= 0 ? cells[studentIdIdx] : undefined
      const weightRaw = weightIdx >= 0 ? Number(cells[weightIdx]) : 1
      const scoreRaw = scoreIdx >= 0 ? Number(cells[scoreIdx]) : 0
      const statusRaw = (statusIdx >= 0 ? cells[statusIdx] : 'active') || 'active'

      const normalizedStatus =
        statusRaw === 'absent' || statusRaw === '缺席'
          ? 'absent'
          : statusRaw === 'excluded' || statusRaw === '排除'
            ? 'excluded'
            : 'active'

      return {
        name,
        studentId: studentId || undefined,
        weight: Number.isFinite(weightRaw) && weightRaw > 0 ? Math.floor(weightRaw) : 1,
        score: Number.isFinite(scoreRaw) ? Math.floor(scoreRaw) : 0,
        status: normalizedStatus as 'active' | 'absent' | 'excluded'
      }
    })
    .filter((row) => row.name.length > 0)
}

export function Students() {
  const {
    classes,
    currentClassId,
    addClass,
    removeClass,
    addStudent,
    addStudents,
    removeStudent,
    updateStudentStatus,
    updateStudentWeight,
    updateStudentScore,
    updateStudentPhoto,
    undoLastChange,
    canUndo
  } = useClassesStore()
  const { fairness } = useSettingsStore()
  const addToast = useToastStore((state) => state.addToast)
  const showConfirm = useConfirmStore((state) => state.show)
  const [newStudentName, setNewStudentName] = useState('')
  const [newClassName, setNewClassName] = useState('')

  const currentClass = classes.find((c) => c.id === currentClassId)

  const handleAddClass = () => {
    if (newClassName.trim()) {
      addClass(newClassName.trim())
      setNewClassName('')
    }
  }

  const handleAddStudent = () => {
    if (newStudentName.trim() && currentClassId) {
      addStudent(currentClassId, {
        id: crypto.randomUUID(),
        name: newStudentName.trim(),
        pickCount: 0,
        score: 0,
        weight: 1,
        status: 'active'
      })
      setNewStudentName('')
    }
  }

  const handleUploadPhoto = async (classId: string, studentId: string) => {
    const filePath = await window.electronAPI.selectFile({
      title: '选择学生照片',
      filters: [{ name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'] }]
    })
    if (filePath) {
      try {
        const fileData = await window.electronAPI.readFile(filePath)
        const sizeMB = fileData.byteLength / (1024 * 1024)
        if (sizeMB > 5) {
          addToast(`照片过大（${sizeMB.toFixed(1)}MB），请选择 5MB 以内的图片`, 'error')
          return
        }
        const targetName = `${studentId}.jpg`
        const photoPath = await window.electronAPI.copyPhoto(filePath, targetName)
        updateStudentPhoto(classId, studentId, photoPath)
        addToast('照片上传成功！', 'success')
      } catch {
        addToast('照片上传失败。', 'error')
      }
    }
  }

  const handleImportStudents = async () => {
    if (!currentClassId) return

    const filePath = await window.electronAPI.selectFile({
      title: '导入学生名单',
      filters: [{ name: '文本文件', extensions: ['txt', 'csv'] }]
    })

    if (filePath) {
      try {
        const content = await window.electronAPI.readTextFile(filePath)
        const parsedRows = parseStudentImportRows(content)

        if (parsedRows.length === 0) {
          addToast('文件内容为空或格式无效。', 'error')
          return
        }

        const existingSet = new Set(
          (currentClass?.students || []).map((student) =>
            `${student.name}::${student.studentId || ''}`.toLowerCase()
          )
        )

        const newStudents = parsedRows
          .filter((row) => {
            const key = `${row.name}::${row.studentId || ''}`.toLowerCase()
            if (existingSet.has(key)) {
              return false
            }
            existingSet.add(key)
            return true
          })
          .map((row) => ({
            id: crypto.randomUUID(),
            name: row.name,
            studentId: row.studentId,
            pickCount: 0,
            score: row.score,
            weight: row.weight,
            status: row.status
          }))

        if (newStudents.length === 0) {
          addToast('没有可导入的新学生（已自动去重）。', 'error')
          return
        }

        addStudents(currentClassId, newStudents)
        addToast(`成功导入 ${newStudents.length} 名学生（已去重）。`, 'success')
      } catch (error) {
        console.error('Import failed:', error)
        addToast('导入失败，请检查文件格式。', 'error')
      }
    }
  }

  return (
    <div className="min-h-full flex flex-col space-y-4 p-6">
      <header className="flex justify-between items-center pb-4">
        <h2 className="text-2xl font-bold text-on-surface">学生管理</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={undoLastChange}
            disabled={!canUndo}
            className="p-2.5 bg-surface-container-high text-on-surface rounded-full disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container-low transition-colors cursor-pointer"
            title="撤销上一步"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <input
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="新班级名称"
            className="px-4 py-2 border border-outline-variant rounded-full text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface-container-low outline-none transition-colors"
          />
          <button
            onClick={handleAddClass}
            className="p-2.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors elevation-1 cursor-pointer"
            title="添加班级"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {classes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-on-surface-variant p-10 space-y-4">
            <div className="p-4 bg-surface-container-high rounded-full">
              <Plus className="w-8 h-8 opacity-50" />
            </div>
            <p>暂无班级。请在上方输入名称并点击添加。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
            {/* Class List */}
            <div className="col-span-1 pr-4 space-y-2 overflow-y-auto">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-on-surface">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                班级列表
              </h3>
              <div className="space-y-1.5">
                {classes.map((c) => {
                  const isActive = currentClassId === c.id
                  const studentCount = c.students.length
                  const activeCount = c.students.filter((s) => s.status === 'active').length
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        'group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200',
                        isActive
                          ? 'bg-secondary-container text-secondary-container-foreground elevation-1'
                          : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                      )}
                      onClick={() => useClassesStore.getState().setCurrentClass(c.id)}
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {c.name.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-sm">{c.name}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-on-surface-variant/60" />
                          <span className="text-[11px] text-on-surface-variant/70">
                            {activeCount}/{studentCount} 人
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          showConfirm('删除班级', '确定要删除这个班级吗？此操作不可撤销。', () =>
                            removeClass(c.id)
                          )
                        }}
                        className="text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-destructive transition-all duration-200 p-1.5 hover:bg-destructive/10 rounded-full shrink-0"
                        title="删除班级"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="col-span-3 flex flex-col h-full overflow-hidden">
              {currentClass ? (
                <>
                  <div className="mb-4 flex space-x-2 shrink-0">
                    <input
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="flex-1 border border-outline-variant px-4 py-2 rounded-full focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface-container-low outline-none transition-colors"
                      placeholder="输入学生姓名..."
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
                    />
                    <button
                      onClick={handleAddStudent}
                      className="px-5 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors elevation-1 whitespace-nowrap font-medium h-10 cursor-pointer"
                    >
                      添加学生
                    </button>
                    <button
                      onClick={handleImportStudents}
                      className="px-5 py-2 bg-secondary-container text-secondary-container-foreground hover:bg-secondary-container/80 rounded-full flex items-center gap-2 whitespace-nowrap transition-colors font-medium h-10 cursor-pointer"
                      title="从文本文件导入（每行一个名字）"
                    >
                      <Upload className="w-4 h-4" />
                      导入
                    </button>
                  </div>

                  <div className="rounded-xl bg-surface-container elevation-0 flex-1 overflow-hidden flex flex-col">
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-sm">
                        <thead className="bg-surface-container-high sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-on-surface-variant">
                              姓名
                            </th>
                            {fairness.weightedRandom && (
                              <th className="px-4 py-3 text-center font-semibold text-on-surface-variant">
                                权重
                              </th>
                            )}
                            <th className="px-4 py-3 text-center font-semibold text-on-surface-variant">
                              积分
                            </th>
                            <th className="px-4 py-3 text-center font-semibold text-on-surface-variant">
                              被抽中
                            </th>
                            <th className="px-4 py-3 text-center font-semibold text-on-surface-variant">
                              状态
                            </th>
                            <th className="px-4 py-3 text-center font-semibold text-on-surface-variant">
                              操作
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentClass.students.map((student) => (
                            <tr
                              key={student.id}
                              className="border-b border-outline-variant/30 last:border-0 hover:bg-surface-container-high/50 transition-colors"
                            >
                              <td className="px-4 py-3 font-medium text-on-surface">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUploadPhoto(currentClass.id, student.id)}
                                    className="relative w-8 h-8 rounded-full shrink-0 group/avatar cursor-pointer overflow-hidden"
                                    title="点击上传照片"
                                  >
                                    {student.photo ? (
                                      <img
                                        src={toFileUrl(student.photo)}
                                        alt={student.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                        {student.name.slice(0, 1)}
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                      <Camera className="w-3.5 h-3.5 text-white" />
                                    </div>
                                  </button>
                                  {student.name}
                                </div>
                              </td>

                              {fairness.weightedRandom && (
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button
                                      onClick={() =>
                                        updateStudentWeight(
                                          currentClass.id,
                                          student.id,
                                          Math.max(0, (student.weight || 1) - 1)
                                        )
                                      }
                                      className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-6 text-center text-on-surface">
                                      {student.weight || 1}
                                    </span>
                                    <button
                                      onClick={() =>
                                        updateStudentWeight(
                                          currentClass.id,
                                          student.id,
                                          (student.weight || 1) + 1
                                        )
                                      }
                                      className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}

                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                  <button
                                    onClick={() =>
                                      updateStudentScore(
                                        currentClass.id,
                                        student.id,
                                        (student.score || 0) - 1
                                      )
                                    }
                                    className="p-1.5 rounded-full hover:bg-destructive/10 text-on-surface-variant hover:text-destructive cursor-pointer transition-colors"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span
                                    className={`w-10 text-center font-bold tabular-nums text-sm ${(student.score || 0) > 0 ? 'text-green-600 dark:text-green-400' : (student.score || 0) < 0 ? 'text-destructive' : 'text-on-surface-variant'}`}
                                  >
                                    {student.score || 0}
                                  </span>
                                  <button
                                    onClick={() =>
                                      updateStudentScore(
                                        currentClass.id,
                                        student.id,
                                        (student.score || 0) + 1
                                      )
                                    }
                                    className="p-1.5 rounded-full hover:bg-primary/10 text-on-surface-variant hover:text-primary cursor-pointer transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-center">
                                <span className="inline-flex items-center justify-center min-w-[1.5rem] px-2.5 py-0.5 rounded-full bg-secondary-container text-secondary-container-foreground text-xs font-medium">
                                  {student.pickCount}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={cn(
                                    'px-2.5 py-1 rounded-full text-xs font-medium',
                                    student.status === 'active'
                                      ? 'bg-secondary-container text-secondary-container-foreground'
                                      : student.status === 'absent'
                                        ? 'bg-tertiary-container text-tertiary'
                                        : 'bg-destructive/10 text-destructive'
                                  )}
                                >
                                  {student.status === 'active'
                                    ? '正常'
                                    : student.status === 'absent'
                                      ? '缺席'
                                      : '排除'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right space-x-1">
                                <button
                                  title={student.status === 'active' ? '设为缺席' : '设为正常'}
                                  onClick={() =>
                                    updateStudentStatus(
                                      currentClass.id,
                                      student.id,
                                      student.status === 'active' ? 'absent' : 'active'
                                    )
                                  }
                                  className="p-2 hover:bg-surface-container-high rounded-full text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                                >
                                  {student.status === 'active' ? (
                                    <UserX className="w-4 h-4" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  title="删除学生"
                                  onClick={() =>
                                    showConfirm(
                                      '删除学生',
                                      '确定要删除这位学生吗？此操作不可撤销。',
                                      () => removeStudent(currentClass.id, student.id)
                                    )
                                  }
                                  className="p-2 hover:bg-destructive/10 rounded-full text-on-surface-variant hover:text-destructive transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {currentClass.students.length === 0 && (
                            <tr>
                              <td
                                colSpan={6 + (fairness.weightedRandom ? 1 : 0)}
                                className="p-10 text-center text-on-surface-variant"
                              >
                                <p>该班级暂无学生。</p>
                                <p className="text-xs opacity-70 mt-1">请添加学生或导入名单</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-on-surface-variant space-y-4">
                  <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center">
                    <UserX className="w-8 h-8 opacity-50" />
                  </div>
                  <p>请选择一个班级以管理学生</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
