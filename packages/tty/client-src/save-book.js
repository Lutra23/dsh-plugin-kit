/**
 * @hyzyn/dsh-tty — 「保存到连接簿」勾选框 ⇄ 连接簿名称框的联动（**纯逻辑**，进 vitest）。
 *
 * 用户原话「**这个默认展开吧**」（贴的是「保存到连接簿（同名覆盖）+ 连接簿名称」那一块）：
 * 从前名称框要**先勾上勾选框才出现**，想改个名字得先勾、再回头找那一行。现在名称行**常显**，
 * 勾选状态交给名称决定。
 *
 * 规则（四条，都是「界面上看得见的状态 = 真正会发生的事」）：
 *   ① 名称框里**填了名字** → 自动勾上（省一次点击）；
 *   ② 名称**清空** → 自动取消（没名字 = 不保存，回到默认态）；
 *   ③ 手动**勾上**且名称为空 → 用主机名兜底（保存路径本来就 `name || host`，这里把它显形）；
 *   ④ 手动**取消** → 连名字一起清掉。**不能**留下「名字还写在框里、但按下去不会保存」——
 *      那正是本仓反复出现的那类静默无操作（见 D91）。
 *
 * 抽成纯模块的理由与 `jump-field.js` / `ws-url.js` 相同：`client.js` 是构建产物、不在 vitest
 * 层测；留在对话框闭包里的这几条分支等于没有测试入口，而「清空名字却不取消勾选」这类错法
 * 在界面上只是"存了一条名字为空、按主机名兜底的条目"，肉眼看不出来。
 */

/** 名称框里的值算不算「填了名字」（纯空白不算）。 */
export function bookNameFilled(value) {
  return String(value ?? '').trim() !== ''
}

/** 名称框输入之后：勾选框该是什么状态（填了名字 = 要保存）。 */
export function checkedForBookName(value) {
  return bookNameFilled(value)
}

/**
 * 勾选框被点之后：名称框该显示什么。
 *
 * - **取消勾选** → 空串（规则 ④：不留「名字还在但不会保存」的悬空态）；
 * - **勾上** → 用户已经填了名字就用他那一份（原样返回，不做 trim——名字里的空白由用户说了算），
 *   没填才用主机名兜底（规则 ③）。
 *
 * @param {boolean} checked 勾选框的新状态
 * @param {unknown} name 名称框当前内容
 * @param {unknown} host 主机字段当前内容（兜底用）
 * @returns {string}
 */
export function nameForBookChecked(checked, name, host) {
  if (checked !== true) return ''
  if (bookNameFilled(name)) return String(name)
  return String(host ?? '').trim()
}
