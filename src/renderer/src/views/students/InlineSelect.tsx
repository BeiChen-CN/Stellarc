import type { ReactElement } from 'react'
import { Dropdown, type DropdownOption } from '../../components/Dropdown'

export type { DropdownOption }

/** 表格行内紧凑下拉（交互逻辑复用 components/Dropdown），泛型保留调用方的值联合类型 */
export function InlineSelect<T extends string>({
  value,
  options,
  onChange,
  placeholder
}: {
  value: T
  options: DropdownOption[]
  onChange: (value: T) => void
  placeholder: string
}): ReactElement {
  return (
    <Dropdown
      value={value}
      options={options}
      onChange={(v) => onChange(v as T)}
      placeholder={placeholder}
      triggerClassName="px-2.5 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface outline-none cursor-pointer inline-flex items-center gap-1.5"
      panelClassName="absolute z-30 mt-1 min-w-[150px] max-h-56 overflow-y-auto custom-scrollbar rounded-xl border border-outline-variant/30 bg-surface-container p-1 elevation-2"
      itemClassName="w-full text-left px-2 py-1.5 text-xs rounded-lg cursor-pointer"
    />
  )
}
