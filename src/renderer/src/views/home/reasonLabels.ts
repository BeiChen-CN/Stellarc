/** 抽选 reason code 的展示文案（code 枚举定义在引擎 selection/types 中） */

export const REASON_LABELS: Record<string, string> = {
  eligible: '可抽取',
  excluded_by_status: '状态排除',
  excluded_by_manual: '手动禁选',
  excluded_by_cooldown: '冷却排除',
  weighted: '权重抽取',
  strategy_adjusted: '策略修正',
  balance_target_boost: '学期均衡',
  stage_fairness_boost: '阶段公平',
  priority_unpicked: '优先未抽中',
  fallback_relaxed_constraints: '自动放宽',
  fallback_random: '随机兜底'
}

export const REASON_TOOLTIPS: Record<string, string> = {
  eligible: '该学生满足当前抽选条件，可参与本轮抽选。',
  excluded_by_status: '学生状态不是“可参与”（如缺席/排除），因此不参与本轮。',
  excluded_by_manual: '你在“临时禁选”中手动排除了该学生。',
  excluded_by_cooldown: '该学生命中防重复冷却规则，暂时不参与本轮。',
  weighted: '本轮使用权重抽取，学生基础权重会影响被抽中概率。',
  strategy_adjusted: '策略预设对基础权重进行了额外修正。',
  balance_target_boost: '学期均衡策略会降低高频学生权重，提升整体公平性。',
  stage_fairness_boost: '最近多次被抽中的学生会在阶段公平中被适度降权。',
  priority_unpicked: '该学生属于“本学期未抽中优先”名额。',
  fallback_relaxed_constraints: '因约束冲突导致无可选人，系统自动放宽了部分限制。',
  fallback_random: '当前使用随机兜底逻辑，按候选集合随机抽取。'
}
