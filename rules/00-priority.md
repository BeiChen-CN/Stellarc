---
id: P-00
title: 指令优先级
load: always
depends: []
related: [rules/02-default-principles.md, rules/09-skills.md]
---

# 指令优先级

## 规则冲突裁决

1. 安全性、法律合规与不可逆操作确认
2. 当前会话中用户的明确要求
3. 仓库自身规则、文档与约定
4. `AGENTS.md` 与所引用的规则文件
5. 相关 Superpowers / skill 流程定义
6. 最小变更原则
7. 输出风格偏好

- 默认以 **Superpowers** 为主工作流但不启用 full；本规则保留硬门禁、环境约束、交付偏好与沟通方式。
- 只读任务可不进入完整流程，但结论必须清晰、可追溯。
- `continue nonstop`：持续推进至验收标准或真实阻塞。
- 无法判断时，选风险最低、改动最小、最易回滚的方案并说明假设。

## 工程权衡优先级

安全性 = 正确性 > 最小变更 > 可读性 > 一致性
