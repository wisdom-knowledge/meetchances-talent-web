export interface ReferralParams {
  referral_source?: string
  referral_uid?: string
}

function getQueryParam(name: string, search: string): string | null {
  const sp = new URLSearchParams(search)
  const v = sp.get(name)
  return v && v.trim() ? v.trim() : null
}

export function getReferralParams(): ReferralParams {
  let referral_source: string | null = null
  let referral_uid: string | null = null

  try {
    // source: 优先 URL 的 `_fr`，其次 localStorage `_fr`
    referral_source = getQueryParam('_fr', window.location.search)
    if (!referral_source) {
      const ls = localStorage.getItem('_fr')
      referral_source = ls && ls.trim() ? ls.trim() : null
    }

    // uid: 优先 URL 的 `share_user_id`，其次 localStorage `share_user_id`
    referral_uid = getQueryParam('share_user_id', window.location.search)
    if (!referral_uid) {
      const ls = localStorage.getItem('share_user_id')
      referral_uid = ls && ls.trim() ? ls.trim() : null
    }
  } catch (_e) {
    // ignore
  }

  const result: ReferralParams = {}
  if (referral_source) result.referral_source = referral_source
  if (referral_uid) result.referral_uid = referral_uid
  return result
}

export function appendReferralParams(targetUrl: string): string {
  if (!targetUrl) return targetUrl

  const { referral_source, referral_uid } = getReferralParams()

  // 针对传入 targetUrl 可能已经包含查询串/fragment 的情况做安全拼接
  try {
    const url = new URL(targetUrl)

    // 以“在 state 参数之前插入 referral_* 参数”为目标，重建查询串
    const pairs = Array.from(url.searchParams.entries())
    const filtered = pairs.filter(([k]) => k !== 'referral_source' && k !== 'referral_uid')
    const stateIndex = filtered.findIndex(([k]) => k === 'state')
    const statePair = stateIndex >= 0 ? filtered[stateIndex] : null
    const beforeState = stateIndex >= 0 ? filtered.slice(0, stateIndex) : filtered
    const afterState = stateIndex >= 0 ? filtered.slice(stateIndex + 1) : []

    const referralPairs: Array<[string, string]> = []
    if (referral_source) referralPairs.push(['referral_source', referral_source])
    if (referral_uid) referralPairs.push(['referral_uid', referral_uid])

    let ordered: Array<[string, string]> = []
    if (statePair) {
      // 在 state 前插入 referral_*，并保持其它参数的相对顺序
      ordered = [...beforeState, ...referralPairs, statePair, ...afterState]
    } else {
      // 没有 state，则直接追加 referral_*
      ordered = [...filtered, ...referralPairs]
    }

    const rebuilt = new URLSearchParams(ordered)
    url.search = rebuilt.toString()
    return url.toString()
  } catch (_e) {
    // 如果不是绝对 URL，进行手动插入：在第一个 state 之前插入 referral_*；若无 state 则末尾追加
    const hasQuery = targetUrl.includes('?')
    const insert = [
      referral_source ? `referral_source=${encodeURIComponent(referral_source)}` : '',
      referral_uid ? `referral_uid=${encodeURIComponent(referral_uid)}` : '',
    ].filter(Boolean)
    if (insert.length === 0) return targetUrl

    const qIndex = targetUrl.indexOf('?')
    if (!hasQuery || qIndex < 0) {
      return `${targetUrl}?${insert.join('&')}`
    }

    const base = targetUrl.slice(0, qIndex + 1)
    const rest = targetUrl.slice(qIndex + 1)
    const stateMatch = rest.match(/(^|&)(state=[^&]*)/)
    if (stateMatch && stateMatch.index != null) {
      const idx = stateMatch.index + (stateMatch[1] ? stateMatch[1].length : 0)
      const before = rest.slice(0, idx)
      const after = rest.slice(idx)
      const sep = before && !before.endsWith('&') ? '&' : ''
      return `${base}${before}${sep}${insert.join('&')}&${after}`
    }

    // 没有 state，直接追加
    return `${targetUrl}&${insert.join('&')}`
  }
}


