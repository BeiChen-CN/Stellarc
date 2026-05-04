---
id: EG-05
title: 工程实践与编码规范
load: on-task-type
depends: [rules/04-progress-verify.md]
related: [rules/08-git.md, rules/02-default-principles.md]
---

# 工程实践

## 快速上手

1. 阅读仓库上下文：相关文件、文档、最近提交，优先理解模块边界。
2. 若用户提供 `plan2go=<path>`，将该文件视为执行来源并保持同步。
3. 理解架构/调用链/数据流时优先用 `mcp__ace-tool__search_context`；`rg`/`grep` 仅用于已知字符串精确定位。

## 文档维护

- 轻量任务默认不更新文档；中大型任务中关键决策/进度变化时应同步更新。
- 默认文档根目录：Windows `%USERPROFILE%\.codex` / Linux `~/.codex`；项目提供 `.codex/` 或 `.agent/` 时优先使用。
- 按仓库路径层级在根目录下建子目录；用户指定路径时以用户为准。
- 有价值经验沉淀到项目级 `AGENTS.md`，模板含：标题、触发信号、根因、正确做法、验证方式、适用范围。

## 执行原则

1. 先澄清再实现，先缩小边界再扩展。
2. 优先局部修改与最小充分实现。
3. 复杂度上升时升级流程，收敛时降级（[→ rules/02-default-principles.md#流程升级/降级](02-default-principles.md#流程升级--降级)）。
4. 重构先保持行为不变再提升结构；必要时先补测试。
5. 循环导入优先提取共享逻辑；较大重构先拆分计划。
6. 不扩展需求；发现安全/数据/性能隐患在主需求完成后单独报告。

## 编码规范

- SOLID、DRY、关注点分离、YAGNI；命名清晰，边界条件显式处理。
- 复杂度：函数 ≤50 行、文件 ≤300 行、嵌套 ≤3 层、参数 ≤3 个、圈复杂度 ≤10；突破需有理由。禁止魔法数字。
- 中文注释和文档（除非有要求）；UTF-8 无 BOM。
- 关键逻辑/接口/非显而易见决策必须注释。
- 优先用已有依赖/标准库/原生控件；禁止擅自引入新依赖，确需时说明理由。
- 相似功能实现方式保持统一。
- 日志：记录入参/分支决策/异常/关键状态变化；循环和高频调用内不记录非必要日志。
- 错误：可恢复就近处理并记录；不可恢复 fail-fast；禁止空 `catch`。
- Bug 报告：现象、触发条件、预期/实际、影响范围、严重程度及日志/堆栈/环境。
- 真实 bug 优先 `systematic-debugging`，先确认根因再修复。
- 测试规范见 [→ rules/04-progress-verify.md#测试策略](04-progress-verify.md#测试策略)。

## Safety Rules

- 禁止破坏性命令（如 `git reset`）除非用户要求；禁止非 Git 工具操作 `.git`。
- 禁止密钥/凭证硬编码；数据库用参数化查询；不用不可信输入拼接 shell/SQL。
- 禁止终止非当前任务进程（除非用户要求）。
- 以下操作须确认：删除文件、大规模重构、shared contract/schema/types、根配置/CI/依赖、数据库变更、git 历史/远程操作、越界改动。

## MCP 工具使用规范

- 失败降级：MCP 工具失败时尝试替代方案；全部失败时提供保守答案并标记不确定性。
- **ace-tool**：代码检索优先，`rg` 作后备。
- **context7**：查文档先 `resolve-library-id` 再 `get-library-docs`。
- **chrome-devtools**：浏览器自动化；写操作须二次确认。
- **mcp-server-fetch**：通用 HTTP 请求。
- **server-memory**：知识图谱记忆，跨会话保留信息。
- **server-sequential-thinking**：顺序思考，复杂问题分步推理。
