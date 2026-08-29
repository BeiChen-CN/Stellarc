/** 快捷键显示格式化（设置页共用） */
export function formatAccelerator(acc: string): string {
  return acc
    .replace(/Ctrl/g, 'Ctrl')
    .replace(/Alt/g, 'Alt')
    .replace(/Shift/g, 'Shift')
    .replace(/\+/g, ' + ')
}
