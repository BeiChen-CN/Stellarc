/** CSV 单元格转义：包裹双引号并转义内部引号（导出模块共用） */
export function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}
