/**
 * @hyzyn/dsh-tty — 连接对话框「三段式外壳 + 高级折叠区」的源码契约（0.31.0）。
 *
 * ## 现场
 * 用户贴了「编辑连接 · 252」的长截图：「**这个 tty 添加连接的面板内容太长，需要优化一下，而且
 * 标题和底部按钮栏应该固定**」（1680×1050 下打开对话框，底部那颗「连接」初始根本不在视口里）。
 * 随后又贴了**宿主官方 provider 卡片**的「自定义设置」一行、红框圈住它的尖括号：
 * 「**展开图标和 dsh 官方的图标保持一致**」。
 *
 * ## 为什么这半在**源码**上判（preview 那半之外）
 * - **滚动归属**：preview 的 `sshFrameProblem()` 量的是几何（把中段滚到底后标题 / 动作行还在不在），
 *   但它在「内容没溢出」的窗口里会**跳过滚动那半**——1050px 高的视口正是这种情况。滚动该归谁这条
 *   声明本身在这里钉，任何窗口下都判得到。
 * - **`hidden` 属性压得住 `display: flex`**：`.tt_sshAdvBody` 是 flex 容器（同特异度下 `display: flex`
 *   会盖掉 `hidden` 属性的 UA 样式），不补 `[hidden] { display: none }` 收起态**看着就是展开的**——
 *   这类缺陷只有真浏览器才露，静态判据先把它兜住。
 * - **展开图标**：逐字等于宿主 `dsh-client-ui-primitives` 的 `IconChevronRightOutlineRegular`（收起）
 *   / `IconChevronDownOutlineRegular`（展开）——官方 provider 卡片的「自定义设置」就是这么一对。
 *   宿主升级换了图形时这条会红：**改它之前先回去对宿主那份**（与 `dsh-theme-tokens.json` 快照同一
 *   纪律，只是图标没有生成脚本，所以判据就是这条手抄的比对）。
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { declValue, parseCssRules } from '../../../scripts/client-design-tokens.mjs'

const css = readFileSync(new URL('../client-src/tty.css', import.meta.url), 'utf8')
const js = readFileSync(new URL('../client-src/index.js', import.meta.url), 'utf8')

interface Rule {
  /** 选择器列表（空白已归一，逗号分隔） */
  selector: string
  /** 声明块原文 */
  decls: string
}

/*
 * 规则扫描与取值走**仓库级共享实现**（`scripts/client-design-tokens.mjs`）：client-lint 的
 * 检查四~十六读的是同一份文本形状，这里自己再写一份 `parseRules` 一定会漂。
 */
const rules = parseCssRules(css) as Rule[]

/**
 * **单选择器**的那条规则（`.tt_sshCard { … }` 自己那条）。
 *
 * 不能按「选择器列表里含这个类」取第一条：同一批类名还有一条共享底色的组合规则（
 * `.tt_modal, .tt_sshCard, .tt_sftpCard, … { background-color: … }`），它自带 `.tt_sshCard`
 * 却与几何无关——取到它，判据就永远量不到真的那条。
 */
const soleRule = (selector: string): Rule => {
  const hit = rules.find((rule) => rule.selector.trim() === selector)
  if (hit === undefined) throw new Error('样式表里找不到单独一条 ' + selector)
  return hit
}

/** `flex` 简写的首值（增长系数）；只写了 `flex-grow` 时退回它。 */
const flexGrow = (rule: Rule): string | undefined => {
  const shorthand = declValue(rule.decls, 'flex')
  if (shorthand === undefined) return declValue(rule.decls, 'flex-grow')
  return shorthand.trim().split(/\s+/)[0]
}

/** 从一个图标常量的 svg 串里取出 path 的 `d`。 */
function iconPath(constName: string): string {
  const literal = new RegExp('const ' + constName + " =\\s*\\n?\\s*'([^']+)'").exec(js)?.[1]
  if (literal === undefined) throw new Error('找不到图标常量 ' + constName)
  const d = /<path d="([^"]+)"/.exec(literal)?.[1]
  if (d === undefined) throw new Error(constName + ' 里没有 path d')
  return d
}

/** 图标 svg 串本身（比对 viewBox / 线宽这些形状参数）。 */
function iconSvg(constName: string): string {
  const literal = new RegExp('const ' + constName + " =\\s*\\n?\\s*'([^']+)'").exec(js)?.[1]
  if (literal === undefined) throw new Error('找不到图标常量 ' + constName)
  return literal
}

/* 宿主的原文（`@deepseek-ai/dsh-client-ui-primitives` lib/index.js，2026-10-11 抄录）。 */
const HOST_CHEVRON_RIGHT = 'M6 12L9.29289 8.70711C9.68342 8.31658 9.68342 7.68342 9.29289 7.29289L6 4'
const HOST_CHEVRON_DOWN = 'M4 6L7.29289 9.29289C7.68342 9.68342 8.31658 9.68342 8.70711 9.29289L12 6'

describe('连接对话框：滚动只归中段（三段式外壳）', () => {
  it('卡片自己不再是滚动容器', () => {
    const card = soleRule('.tt_sshCard')
    expect(declValue(card.decls, 'overflow')?.trim()).toBe('hidden')
    // 老写法（`overflow-y: auto` 挂在卡片上）就是这一轮要否掉的那条
    expect(declValue(card.decls, 'overflow-y')).toBeUndefined()
  })

  it('头尾不参与伸缩、中段是唯一的滚动区', () => {
    expect(flexGrow(soleRule('.tt_sshHead'))).toBe('none')
    expect(flexGrow(soleRule('.tt_sshFoot'))).toBe('none')
    const body = soleRule('.tt_sshBody')
    expect(flexGrow(body)).toBe('1')
    expect(declValue(body.decls, 'overflow-y')?.trim()).toBe('auto')
    // flex 子项能被压缩的前提：少了它，内容会把卡片顶出 max-height（头尾照样被挤走）
    expect(declValue(body.decls, 'min-height')?.trim()).toBe('0')
  })
})

describe('「高级」折叠区', () => {
  it('hidden 属性压得住 display:flex（否则收起态看着是展开的）', () => {
    const hiddenRule = soleRule('.tt_sshAdvBody[hidden]')
    expect(declValue(hiddenRule.decls, 'display')?.trim()).toBe('none')
    expect(declValue(soleRule('.tt_sshAdvBody').decls, 'display')?.trim()).toBe('flex')
  })

  it('展开图标逐字等于宿主那一对尖括号', () => {
    expect(iconPath('ICON_CHEVRON_RIGHT')).toBe(HOST_CHEVRON_RIGHT)
    expect(iconPath('ICON_CHEVRON_DOWN')).toBe(HOST_CHEVRON_DOWN)
  })

  it('图标形状与宿主同档：16 网格 / 14px / 1px 描边 / currentColor', () => {
    for (const name of ['ICON_CHEVRON_RIGHT', 'ICON_CHEVRON_DOWN']) {
      const svg = iconSvg(name)
      expect(svg).toContain('viewBox="0 0 16 16"')
      expect(svg).toContain('width="14" height="14"')
      expect(svg).toContain('stroke="currentColor"')
      expect(svg).toContain('stroke-width="1"')
      // 逐字对齐宿主：宿主那份没写 linecap / linejoin（默认 butt / miter）
      expect(svg).not.toContain('stroke-linecap')
      expect(svg).not.toContain('stroke-linejoin')
    }
  })

  it('按开合换图标本身，不再靠 transform 旋转（官方那对是两个图形）', () => {
    // 收起 → 右尖括号、展开 → 下尖括号：切换语句在 setAdvancedOpen 走的 syncAdvanced 里
    expect(/advChevron\.innerHTML = open \? ICON_CHEVRON_DOWN : ICON_CHEVRON_RIGHT/.test(js)).toBe(true)
    // 反例自证：上一版是「一个向下箭头 + CSS 旋转」，那条路在这套判据下必红
    const rotated = rules.filter((rule) => /tt_sshAdvChevron/.test(rule.selector)
      && declValue(rule.decls, 'transform') !== undefined)
    expect(rotated).toEqual([])
  })
})
