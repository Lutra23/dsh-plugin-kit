/**
 * @hyzyn/dsh-tty — 「保存到连接簿」勾选框 ⇄ 连接簿名称框（`client-src/save-book.js`）。
 *
 * 为什么值得单测：这四条规则错掉时，界面**看不出来**——最典型的一条是「手动取消勾选后名字还
 * 留在框里」，那时按下去既不会保存、也没有任何提示（本仓 D91 那类静默无操作）。用户在真机上
 * 只会觉得「我明明填了名字怎么什么都没发生」。
 */
import { describe, expect, it } from 'vitest'
import { bookNameFilled, checkedForBookName, nameForBookChecked } from '../client-src/save-book.js'

describe('bookNameFilled', () => {
  it('纯空白不算填了名字', () => {
    expect(bookNameFilled('')).toBe(false)
    expect(bookNameFilled('   ')).toBe(false)
    expect(bookNameFilled('\t\n')).toBe(false)
    expect(bookNameFilled(undefined)).toBe(false)
    expect(bookNameFilled(null)).toBe(false)
  })

  it('有实体字符就算（两侧空白不影响判定）', () => {
    expect(bookNameFilled('db')).toBe(true)
    expect(bookNameFilled('  db  ')).toBe(true)
  })
})

describe('checkedForBookName', () => {
  it('填了名字 → 自动勾上；清空 → 自动取消', () => {
    expect(checkedForBookName('staging-db')).toBe(true)
    expect(checkedForBookName('')).toBe(false)
    expect(checkedForBookName('   ')).toBe(false)
  })
})

describe('nameForBookChecked', () => {
  it('取消勾选 → 名字一起清掉（不留「名字还在但不会保存」的悬空态）', () => {
    expect(nameForBookChecked(false, 'staging-db', 'db.internal')).toBe('')
    expect(nameForBookChecked(false, '', 'db.internal')).toBe('')
  })

  it('勾上且名称为空 → 用主机名兜底（保存路径本来就 `name || host`）', () => {
    expect(nameForBookChecked(true, '', 'db.internal')).toBe('db.internal')
    // 主机字段两侧的空白不该带进名字里
    expect(nameForBookChecked(true, '', '  db.internal  ')).toBe('db.internal')
    // 主机也空 → 保持空（保存路径那时仍会回落，界面上不编一个假名字出来）
    expect(nameForBookChecked(true, '', '')).toBe('')
  })

  it('勾上且已经填了名字 → 原样保留（不 trim、不覆盖用户写的那份）', () => {
    expect(nameForBookChecked(true, 'my server', 'db.internal')).toBe('my server')
    expect(nameForBookChecked(true, '  my server  ', 'db.internal')).toBe('  my server  ')
  })
})
