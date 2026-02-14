import { useMemo, useState, type ReactElement } from 'react'
import { BookTemplate, Download, Upload, Play, Trash2, Wand2, ClipboardList } from 'lucide-react'
import { useSettingsStore } from '../../store/settingsStore'
import type { AnimationStyle } from '../../store/settingsStore'
import { useClassesStore } from '../../store/classesStore'
import { useToastStore } from '../../store/toastStore'
import { useConfirmStore } from '../../store/confirmStore'

function parseTaskTemplates(
  input: string
): Array<{ id: string; name: string; scoreDelta: number }> {
  return input
    .split(',')
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => {
      const [namePart, scorePart] = chunk.split(':')
      const parsedScore = Number((scorePart || '').replace('+', '').trim())
      return {
        id: crypto.randomUUID(),
        name: (namePart || '').trim(),
        scoreDelta: Number.isFinite(parsedScore) ? Math.trunc(parsedScore) : 1
      }
    })
    .filter((item) => item.name.length > 0)
}

function normalizeAnimationStyle(input: unknown): AnimationStyle {
  if (input === 'scroll') return 'scroll'
  if (input === 'slot') return 'slot'
  if (input === 'flip') return 'flip'
  if (input === 'wheel') return 'wheel'
  if (input === 'bounce') return 'bounce'
  if (input === 'typewriter') return 'typewriter'
  if (input === 'ripple') return 'ripple'
  if (input === 'charByChar') return 'charByChar'
  return 'slot'
}

export function RuleTemplateCenterSection(): ReactElement {
  const {
    ruleTemplates,
    fairness,
    pickCount,
    animationStyle,
    addRuleTemplate,
    updateRuleTemplate,
    removeRuleTemplate,
    replaceRuleTemplates,
    applyRuleTemplate
  } = useSettingsStore()
  const { classes, currentClassId, setClassTaskTemplates } = useClassesStore()
  const addToast = useToastStore((state) => state.addToast)
  const showConfirm = useConfirmStore((state) => state.show)
  const showPrompt = useConfirmStore((state) => state.showPrompt)
  const [templateName, setTemplateName] = useState('')

  const currentClass = useMemo(
    () => classes.find((classItem) => classItem.id === currentClassId),
    [classes, currentClassId]
  )

  const handleCreateFromCurrent = (): void => {
    const name = templateName.trim() || `模板 ${ruleTemplates.length + 1}`
    addRuleTemplate({
      name,
      description: '基于当前抽选规则创建',
      fairness,
      pickCount,
      animationStyle,
      groupTaskTemplates: currentClass?.taskTemplates || []
    })
    setTemplateName('')
    addToast(`已创建规则模板「${name}」`, 'success')
  }

  const handleExportTemplates = async (): Promise<void> => {
    const filePath = await window.electronAPI.saveFile({
      title: '导出规则模板中心',
      defaultPath: 'rule-template-center.json',
      filters: [{ name: 'JSON 文件', extensions: ['json'] }]
    })
    if (!filePath) return
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      templates: ruleTemplates
    }
    const ok = await window.electronAPI.writeExportFile(filePath, JSON.stringify(payload, null, 2))
    addToast(ok ? '规则模板导出成功' : '规则模板导出失败', ok ? 'success' : 'error')
  }

  const handleImportTemplates = async (): Promise<void> => {
    const filePath = await window.electronAPI.selectFile({
      title: '导入规则模板中心',
      filters: [{ name: 'JSON 文件', extensions: ['json'] }]
    })
    if (!filePath) return
    try {
      const raw = await window.electronAPI.readTextFile(filePath)
      const parsed = JSON.parse(raw) as { templates?: unknown[] } | unknown[]
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { templates?: unknown[] }).templates)
          ? ((parsed as { templates?: unknown[] }).templates as unknown[])
          : []

      const normalized = list
        .filter((item) => item && typeof item === 'object')
        .map((item) => {
          const rawItem = item as Record<string, unknown>
          const taskTemplates = Array.isArray(rawItem.groupTaskTemplates)
            ? rawItem.groupTaskTemplates
                .filter((task) => task && typeof task === 'object')
                .map((task) => {
                  const rawTask = task as Record<string, unknown>
                  return {
                    id: typeof rawTask.id === 'string' ? rawTask.id : crypto.randomUUID(),
                    name: typeof rawTask.name === 'string' ? rawTask.name.trim() : '',
                    scoreDelta: Number.isFinite(Number(rawTask.scoreDelta))
                      ? Math.trunc(Number(rawTask.scoreDelta))
                      : 1
                  }
                })
                .filter((task) => task.name.length > 0)
            : []

          const groupStrategy: 'random' | 'balanced-score' =
            (rawItem.fairness as Record<string, unknown>)?.groupStrategy === 'balanced-score'
              ? 'balanced-score'
              : 'random'

          return {
            id: typeof rawItem.id === 'string' ? rawItem.id : crypto.randomUUID(),
            name: typeof rawItem.name === 'string' ? rawItem.name.trim() : '',
            description: typeof rawItem.description === 'string' ? rawItem.description : undefined,
            pickCount: Math.max(1, Math.min(10, Number(rawItem.pickCount) || 1)),
            animationStyle: normalizeAnimationStyle(rawItem.animationStyle),
            fairness: {
              weightedRandom: Boolean(
                (rawItem.fairness as Record<string, unknown>)?.weightedRandom
              ),
              preventRepeat: Boolean((rawItem.fairness as Record<string, unknown>)?.preventRepeat),
              cooldownRounds: Math.max(
                0,
                Number((rawItem.fairness as Record<string, unknown>)?.cooldownRounds) || 0
              ),
              strategyPreset:
                ((rawItem.fairness as Record<string, unknown>)?.strategyPreset as string) ||
                'classic',
              balanceByTerm: Boolean((rawItem.fairness as Record<string, unknown>)?.balanceByTerm),
              stageFairnessRounds: Math.max(
                0,
                Number((rawItem.fairness as Record<string, unknown>)?.stageFairnessRounds) || 0
              ),
              prioritizeUnpickedCount: Math.max(
                0,
                Number((rawItem.fairness as Record<string, unknown>)?.prioritizeUnpickedCount) || 0
              ),
              groupStrategy,
              pairAvoidRounds: Math.max(
                0,
                Number((rawItem.fairness as Record<string, unknown>)?.pairAvoidRounds) || 0
              ),
              autoRelaxOnConflict:
                (rawItem.fairness as Record<string, unknown>)?.autoRelaxOnConflict !== false
            },
            groupTaskTemplates: taskTemplates,
            createdAt:
              typeof rawItem.createdAt === 'string' ? rawItem.createdAt : new Date().toISOString(),
            updatedAt:
              typeof rawItem.updatedAt === 'string' ? rawItem.updatedAt : new Date().toISOString()
          }
        })
        .filter((item) => item.name.length > 0)

      if (normalized.length === 0) {
        addToast('导入失败：文件中没有有效模板', 'error')
        return
      }

      replaceRuleTemplates(normalized)
      addToast(`已导入 ${normalized.length} 条规则模板`, 'success')
    } catch {
      addToast('导入失败：文件格式不正确', 'error')
    }
  }

  return (
    <section className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2 text-on-surface">
        <BookTemplate className="w-5 h-5 text-primary" />
        规则模板中心
      </h3>

      <div className="bg-surface-container rounded-[28px] overflow-hidden p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="模板名称（可选）"
            className="w-56 px-3 py-2 border border-outline-variant rounded-full text-sm bg-surface-container-low outline-none"
          />
          <button
            onClick={handleCreateFromCurrent}
            className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium cursor-pointer"
          >
            从当前规则创建
          </button>
          <button
            onClick={handleImportTemplates}
            className="px-4 py-2 rounded-full bg-surface-container-high text-on-surface text-sm cursor-pointer inline-flex items-center gap-1"
          >
            <Upload className="w-4 h-4" />
            导入模板
          </button>
          <button
            onClick={handleExportTemplates}
            className="px-4 py-2 rounded-full bg-surface-container-high text-on-surface text-sm cursor-pointer inline-flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            导出模板
          </button>
        </div>

        {ruleTemplates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant/40 p-6 text-sm text-on-surface-variant text-center">
            还没有模板，先在抽选规则中调整好参数，再点“从当前规则创建”
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {ruleTemplates.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-outline-variant/30 bg-surface-container-high/40 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-on-surface">{item.name}</div>
                    <div className="text-xs text-on-surface-variant mt-1">
                      人数 {item.pickCount} · 动画 {item.animationStyle} · 冷却{' '}
                      {item.fairness.cooldownRounds}
                    </div>
                    <div className="text-xs text-on-surface-variant mt-0.5">
                      任务模板 {item.groupTaskTemplates?.length || 0} 条
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const ok = applyRuleTemplate(item.id)
                        addToast(
                          ok ? `已应用模板「${item.name}」` : '应用模板失败',
                          ok ? 'success' : 'error'
                        )
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground cursor-pointer inline-flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      应用规则
                    </button>

                    <button
                      onClick={() => {
                        if (!currentClassId) {
                          addToast('请先在学生管理选择一个班级', 'error')
                          return
                        }
                        setClassTaskTemplates(currentClassId, item.groupTaskTemplates || [])
                        addToast(`已将模板任务应用到班级「${currentClass?.name || ''}」`, 'success')
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-secondary-container text-secondary-container-foreground cursor-pointer inline-flex items-center gap-1"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      应用到班级
                    </button>

                    <button
                      onClick={() => {
                        showPrompt(
                          '编辑任务模板',
                          '格式：任务A:+1,任务B:+2',
                          (item.groupTaskTemplates || [])
                            .map(
                              (task) =>
                                `${task.name}:${task.scoreDelta >= 0 ? '+' : ''}${task.scoreDelta}`
                            )
                            .join(','),
                          (value) => {
                            const parsed = parseTaskTemplates(value)
                            updateRuleTemplate(item.id, {
                              groupTaskTemplates: parsed,
                              updatedAt: new Date().toISOString()
                            })
                            addToast('模板任务已更新', 'success')
                          }
                        )
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-surface-container text-on-surface cursor-pointer inline-flex items-center gap-1"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      编辑任务
                    </button>

                    <button
                      onClick={() =>
                        showConfirm('删除模板', `确认删除模板「${item.name}」吗？`, () => {
                          removeRuleTemplate(item.id)
                          addToast('模板已删除', 'success')
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg text-xs text-destructive bg-destructive/10 cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
