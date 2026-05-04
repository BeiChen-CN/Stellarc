# Rules

`rules/` 保存宿主安装与治理工作流仍会暴露的最小规则面。

## Stable Anchors

- `common/agents.md`
- `common/engineering.md`
- `common/quality.md`
- `typescript/coding-style.md`
- `typescript/index.md`

## Rules

- 宿主或检查脚本显式依赖的路径必须保持稳定。
- 零消费者规则叶子优先合并，不再继续平铺。
- 新规则优先进入现有合并页，而不是重新拆成更多单一主题文件。
