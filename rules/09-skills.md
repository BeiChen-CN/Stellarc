---
id: SK-09
title: 技能系统
load: on-demand
depends: [rules/00-priority.md]
related: [rules/02-default-principles.md]
---

# 技能（Skills）

- 存放：`~/.codex/skills/`（个人）与 `.codex/skills/`（项目共享）。
- 任务前判断是否命中 skill；命中时阅读 `SKILL.md` 按流程执行。
- 根据项目实际需求选择性调用，不强制启用无关 skill。
- 主干整合方式见 [→ rules/02-default-principles.md](02-default-principles.md) 各任务策略。

## 技能清单

| 技能名 | 用途 |
|--------|------|
| `research-note-wrap` | 调研总结 / 笔记 |
| `session-wrap` | 会话收尾 |
| `commit-daily-summary` | 提交总结 / 日报 |
| `project-daily-summary` | 项目级日报 |
| `worktree-closeout` | worktree/branch 收口 |
| `codex-parallel-collab` | 并行开发 / 多 worktree 协作 |

## 使用原则

- 本地 skill 可保留私人路径；对外发布须脱敏，不公开 `~/.codex/skills/` 源文件。
- 仅在用户要求、任务复杂或影响结果可信度时说明使用的 skill。
