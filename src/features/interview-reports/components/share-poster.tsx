import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import mobileLogoWhite from '@/assets/images/mobile-logo-white.svg'
import mobileLogo from '@/assets/images/mobile-logo.svg'
import poster_0_10 from '@/assets/images/poster/0-10.svg'
import poster_10_30 from '@/assets/images/poster/10-30.svg'
import poster_30_60 from '@/assets/images/poster/30-60.svg'
import poster_60_80 from '@/assets/images/poster/60-80.svg'
import poster_80_95 from '@/assets/images/poster/80-95.svg'
import poster_96_98 from '@/assets/images/poster/95-98.svg'
import poster_99_100 from '@/assets/images/poster/99-100.svg'
import QRCode from 'qrcode'
import { userEvent } from '@/lib/apm'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface SharePosterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidateName: string
  score: number
  jobName: string
  date: string
  userName?: string
  jobId?: string
}

export function SharePoster({
  open,
  onOpenChange,
  candidateName,
  score,
  jobName,
  date,
  userName,
  jobId,
}: SharePosterProps) {
  const posterRef = useRef<HTMLDivElement>(null)
  // 预览固定宽度（与外层 wrapper 保持一致）
  const PREVIEW_W = 375
  const BASE_W = 1262
  const SCALE_X = PREVIEW_W / BASE_W
  const SCALE_Y = SCALE_X // 因为容器等比缩放，纵横一致
  const pxX = (v: number) => v * SCALE_X
  const pxY = (v: number) => v * SCALE_Y

  // noop

  // 下载海报：直接将预览 DOM 渲染为 PNG，所见即所得
  const downloadPoster = async () => {
    try {
      userEvent('install_poster', '下载海报', {
        jobId: jobId,
        jobName: jobName,
        score: score,
      })
      const node = posterRef.current
      if (!node) {
        toast.error('预览区域未找到')
        return
      }
      // 用 html-to-image 将 DOM 转成 PNG（双倍像素密度，清晰）
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true })
      const link = document.createElement('a')
      link.download = `${candidateName}-面试结果-${date}.png`
      link.href = dataUrl
      link.click()

      toast.success('海报下载成功！')
    } catch (_error) {
      toast.error('下载失败，请重试')
    }
  }

  // 计算域名与二维码链接
  const appEnv = (import.meta.env.VITE_APP_ENV as string) || (import.meta.env.PROD ? 'prod' : 'dev')
  const domain = appEnv === 'test' ? 'talent-test.meetchances.com' : 'talent.meetchances.com'
  const qrLink = `https://${domain}/jobs/${jobId ?? ''}?_fr=wxqr`

  // 生成二维码 Data URL
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const dataUrl = await QRCode.toDataURL(qrLink, { margin: 1, width: 600 })
        if (!aborted) setQrDataUrl(dataUrl)
      } catch (_e) {
        if (!aborted) setQrDataUrl('')
      }
    })()
    return () => {
      aborted = true
    }
  }, [qrLink])

  function getPosterPresetByScore(s: number): {
    title: string
    comment: string
    img: string
    theme: string
    jobColor: string
    footerColor: string
    idColor: string
  } {
    if (s <= 10)
      return {
        title: '离离原上谱',
        comment: '回答像吟诗，面试官差点鼓掌',
        img: '@/assets/images/poster/0-10.svg',
        theme: '#FFFFFF',
        jobColor: '#07FB3C',
        footerColor: '#000000',
        idColor: '#000000',
      }
    if (s <= 30)
      return {
        title: '青铜开荒者',
        comment: '面试全程像打雾，摸不清路',
        img: '@/assets/images/poster/10-30.svg',
        theme: '#000000',
        jobColor: '#E5C300',
        footerColor: '#FFFFFF',
        idColor: '#000000',
      }
    if (s <= 60)
      return {
        title: '新手村勇者',
        comment: '一路小怪练级中，Boss还远着',
        img: '@/assets/images/poster/30-60.svg',
        theme: '#FFFFFF',
        jobColor: '#C994F7',
        footerColor: '#000000',
        idColor: '#FFFFFF',
      }
    if (s <= 80)
      return {
        title: '潜力新秀',
        comment: '技能点齐全，差一个大招爆发',
        img: '@/assets/images/poster/60-80.svg',
        theme: '#000000',
        jobColor: '#31D354',
        footerColor: '#000000',
        idColor: '#000000',
      }
    if (s <= 95)
      return {
        title: '黑马',
        comment: '实力在线，低调得有点过分。你知道黑马之上还有几个等级吗？',
        img: '@/assets/images/poster/80-95.svg',
        theme: '#FFFFFF',
        jobColor: '#FFFFFF',
        footerColor: '#000000',
        idColor: '#FFFFFF',
      }
    if (s <= 98)
      return {
        title: '面试场锦鲤',
        comment: '一般人刷不到这个分数',
        img: '@/assets/images/poster/96-98.svg',
        theme: '#FFFFFF',
        jobColor: '#FFE96E',
        footerColor: '#000000',
        idColor: '#000000',
      }
    return {
      title: '职场天花板',
      comment: '麻烦您出门右拐去总裁办公室，顺便帮我把门带上，谢谢',
      img: '@/assets/images/poster/99-100.svg',
      theme: '#FFFFFF',
      jobColor: '#FFE96E',
      footerColor: '#000000',
      idColor: '#000000',
    }
  }

  const preset = getPosterPresetByScore(Number(score ?? 0))
  const imageMap: Record<string, string> = {
    '@/assets/images/poster/0-10.svg': poster_0_10,
    '@/assets/images/poster/10-30.svg': poster_10_30,
    '@/assets/images/poster/30-60.svg': poster_30_60,
    '@/assets/images/poster/60-80.svg': poster_60_80,
    '@/assets/images/poster/80-95.svg': poster_80_95,
    '@/assets/images/poster/96-98.svg': poster_96_98,
    '@/assets/images/poster/99-100.svg': poster_99_100,
  }
  const posterBg = imageMap[preset.img] ?? poster_10_30

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='!max-w-[90vw] w-auto min-w-[445px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Share2 className='h-5 w-5' />
            分享面试结果
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* 海报预览（使用切好的 SVG 作为背景） */}
          <div className='flex justify-center p-4'>
            <div className='w-[375px] overflow-hidden rounded-lg'>
              <div
                ref={posterRef}
                className='relative aspect-[1262/2063] w-full bg-contain bg-center bg-no-repeat text-[#2D2D2D]'
                style={{
                  backgroundImage: `url(${posterBg})`,
                  // @ts-expect-error CSS vars for Tailwind arbitrary values
                  '--sx': SCALE_X,
                  '--sy': SCALE_Y,
                  '--theme': preset.theme,
                  '--jobColor': preset.jobColor,
                  '--idColor': preset.idColor,
                  '--footerColor': preset.footerColor,
                }}
              >
                {/* 标题区域 */}
                <div className='absolute top-[calc(var(--sy)*1133px)] left-[calc(var(--sx)*161.5px)] z-30 flex h-[calc(var(--sy)*190px)] w-[calc(var(--sx)*939px)] items-center justify-center rounded-[6px] text-[calc(var(--sx)*100px)] leading-none font-extrabold text-white'>
                  {preset.title}
                </div>
                {/* 右侧带 @ 的用户信息 */}
                <div
                  className='absolute top-[calc(var(--sy)*993px)] right-[calc(var(--sx)*164px)] z-[25] max-w-[calc(var(--sx)*1000px)] text-right text-[calc(var(--sx)*80px)] leading-[1.2] font-[300] break-words whitespace-pre-wrap'
                  style={{ color: preset.idColor }}
                >
                  <span className='italic'>@</span>
                  {userName}
                </div>
                {/* 内容区域 */}
                <div className='absolute right-0 bottom-[calc(var(--sy)*300px)] left-0 z-20 flex h-[calc(var(--sy)*486px)] pt-[calc(var(--sy)*136px)] pb-[calc(var(--sy)*63px)]'>
                  <div className='relative h-full w-[44.45%] text-[calc(var(--sx)*40px)] font-medium text-black'>
                    <div className='absolute bottom-[calc(var(--sy)*31px)] left-[calc(var(--sx)*109px)] mr-[calc(var(--sx)*30px)] flex flex-col items-start gap-[calc(var(--sy)*32px)]'>
                      <div
                        className='flex flex-col leading-[1.2] font-medium text-[var(--theme)]'
                        style={{
                          gap: pxY(30),
                          fontSize: `${pxX(40)}px`,
                        }}
                      >
                        <div>
                          在{' '}
                          <span
                            className='font-bold'
                            style={{ color: preset.jobColor }}
                          >
                            {jobName}
                          </span>
                        </div>
                        <div>模拟面试中</div>
                      </div>
                      <div className='flex items-center gap-[calc(var(--sx)*31px)]'>
                        <div className='flex h-[calc(var(--sy)*75px)] items-center text-[calc(var(--sx)*40px)] leading-[calc(var(--sy)*75px)] font-medium text-[var(--theme)]'>
                          获得
                        </div>
                        <div className='flex h-[calc(var(--sy)*75px)] w-[calc(var(--sx)*243px)] items-center justify-center rounded-[calc(var(--sx)*8px)] text-[calc(var(--sx)*50px)] leading-[1] font-black text-white'>
                          {score}分
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className='flex h-full items-center'
                    style={{ width: `${(701 / 1262) * 100}%` }}
                  >
                    <div className='mt-[calc(var(--sy)*24px)] w-full pr-[calc(var(--sx)*64px)] pl-[calc(var(--sx)*44px)] text-[calc(var(--sx)*45px)] leading-[1.3] font-bold break-words whitespace-pre-wrap text-[var(--theme)]'>
                      {preset.comment}
                    </div>
                  </div>
                </div>
                {/* 底部区域 */}
                <div className='absolute right-0 bottom-0 left-0 z-10 flex h-[calc(var(--sy)*300px)] items-center gap-[calc(var(--sx)*54px)] px-[calc(var(--sx)*114px)] py-[calc(var(--sy)*43px)]'>
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt='qrcode'
                      className='h-[calc(var(--sx)*214px)] w-[calc(var(--sx)*214px)] shrink-0'
                    />
                  ) : (
                    <div className='h-[calc(var(--sx)*214px)] w-[calc(var(--sx)*214px)] shrink-0 rounded bg-muted/30' />
                  )}
                  <div
                    className='mt-[calc(var(--sy)*14px)] flex-1 self-start text-[calc(var(--sx)*35px)] leading-[1.5] font-bold whitespace-pre-line text-[var(--footerColor)]'
                  >
                    {`快来https://${domain}\n测测你的面试段位~`}
                  </div>
                </div>
                <img
                  src={
                    preset.footerColor === '#FFFFFF'
                      ? mobileLogoWhite
                      : mobileLogo
                  }
                  alt='logo'
                  className='absolute right-[calc(var(--sx)*71px)] bottom-[calc(var(--sy)*57px)] z-[12] h-[calc(var(--sy)*49px)] w-[calc(var(--sx)*135px)]'
                />
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className='flex justify-center gap-3'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={downloadPoster} className='gap-2'>
              <Download className='h-4 w-4' />
              下载海报分享到朋友圈
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
