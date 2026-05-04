---
id: DP-02
title: 默认原则与任务策略
load: always
depends: []
related: [rules/03-task-routing.md, rules/04-progress-verify.md]
---

# 默认原则

## 最短路径与轻重分流

- 默认采用满足质量要求的最短路径；能直接完成的不升级为更重流程。
- Superpowers 可调节：小任务轻量路径，中任务简短 brainstorming + 短计划，大任务完整流程。
- 并行判断规则见 [→ rules/07-multi-agent.md#并行准入](07-multi-agent.md#并行准入)。

## 轻量任务

- 定义：单文件/小范围修改、明确 bug、配置/文案调整、小测试、局部文档。
- 流程：分析 -> 实现 -> 定向验证 -> 汇报；跳过完整 brainstorming / writing-plans / worktrees。
- 仅在关键不确定且上下文无法回答时提问，首次最多 1 问；未获回复且风险可控则说明假设继续。
- spec/plan 默认仅服务执行，不强制生成独立文件；仅在用户要求或有长期协作价值时入库。
- 当前分支内可默认修改任务直接相关的代码、测试、文档及配套文件。

## 中型任务

- 定义：局部功能、中小 bug、局部行为变化、边界清晰的重构。
- 流程：简短 brainstorming -> 短计划（目标/边界/风险/验证方式）-> 实现 -> 验证 -> 总结。
- 优先一次性给出 2-3 个方案与推荐。

## 大型任务

- 定义：新功能、大范围重构、公共 API/schema/shared types 改动、持久化/并发/共享逻辑。
- 流程：brainstorming -> writing-plans -> implementation -> review -> verification-before-completion。
- 具体 skill 调用见 [→ rules/09-skills.md](09-skills.md)。

## 流程升级 / 降级

- 升级：影响超出初始判断、涉及公共 API/schema/持久化/并发/共享逻辑、需求不清、验证不足。
- 降级：改动局部且边界清晰、不涉及共享核心逻辑、验证直接、成本高于收益、单点修复。
