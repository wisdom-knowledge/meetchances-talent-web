import { useCallback, useEffect } from 'react'
import { useWeChatInit } from './use-wechat-init'

export interface UseWeChatShareOptions {
  shareTitle: string
  shareDesc: string
  shareImgUrl: string
  shareLink?: string
  url?: string
  appId?: string
  debug?: boolean
  enabled?: boolean
}

/**
 * 微信分享Hook
 * @param options 分享配置选项
 */
export function useWeChatShare(options: UseWeChatShareOptions) {
  const {
    shareTitle,
    shareDesc,
    shareImgUrl,
    shareLink = typeof window !== 'undefined' ? window.location.href : '',
    url = typeof window !== 'undefined'
      ? window.location.href.split('#')[0]
      : '',
    appId = 'wx98c3a9aff6cd772b',
    debug = false,
    enabled = true,
  } = options

  // 使用微信初始化Hook
  const { isWeChat, initWeChatSDK } = useWeChatInit({
    appId,
    debug,
    url,
    jsApiList: ['updateTimelineShareData', 'updateAppMessageShareData'],
  })

  // 设置微信分享内容
  const setupWeChatShare = useCallback(() => {
    if (!shareTitle || typeof window === 'undefined' || !window.wx) {
      return
    }

    // 分享到朋友圈
    window.wx.updateTimelineShareData({
      title: shareTitle,
      link: shareLink,
      imgUrl: shareImgUrl,
      success: () => {
        // 分享成功回调
      },
      cancel: () => {
        // 分享取消回调
      },
    })

    // 分享给朋友
    window.wx.updateAppMessageShareData({
      title: shareTitle,
      desc: shareDesc,
      link: shareLink,
      imgUrl: shareImgUrl,
      success: () => {
        // 分享成功回调
      },
      cancel: () => {
        // 分享取消回调
      },
    })

    // 分享配置完成
  }, [shareTitle, shareDesc, shareLink, shareImgUrl])

  // 自动初始化
  useEffect(() => {
    if (!enabled) return

    if (isWeChat) {
      initWeChatSDK(setupWeChatShare)
    }
  }, [enabled, isWeChat, initWeChatSDK, setupWeChatShare])
}
