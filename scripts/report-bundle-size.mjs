/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const roots = ['dist', 'out']

function walk(dir, list = []) {
  const entries = readdirSync(dir, { withFileTypes: true })
  entries.forEach((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, list)
      return
    }
    const size = statSync(full).size
    list.push({ path: full.replace(/\\/g, '/'), size })
  })
  return list
}

function toMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2)
}

function reportRoot(root) {
  try {
    const files = walk(root)
    const total = files.reduce((sum, file) => sum + file.size, 0)
    const top10 = [...files].sort((a, b) => b.size - a.size).slice(0, 10)
    console.log(`\n[${root}] total: ${toMB(total)} MB (${files.length} files)`)
    top10.forEach((file, idx) => {
      console.log(`${String(idx + 1).padStart(2, '0')}. ${toMB(file.size)} MB  ${file.path}`)
    })
  } catch {
    console.log(`\n[${root}] not found, skip`)
  }
}

console.log('Bundle size attribution report')
roots.forEach(reportRoot)
