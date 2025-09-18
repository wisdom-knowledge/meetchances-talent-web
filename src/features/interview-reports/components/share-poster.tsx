import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface SharePosterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidateName: string
  score: number
  position: string
  date: string
}

export function SharePoster({
  open,
  onOpenChange,
  candidateName,
  score,
  position,
  date,
}: SharePosterProps) {
  const posterRef = useRef<HTMLDivElement>(null)

  // 获取得分等级
  const getScoreLevel = (score: number) => {
    if (score >= 90) return '优秀'
    if (score >= 80) return '良好'
    if (score >= 60) return '及格'
    return '待提升'
  }

  // 下载海报 - 纯 Canvas 绘制，完全精准
  const downloadPoster = async () => {
    try {
      // 创建高清 Canvas
      const canvas = document.createElement('canvas')
      const scale = 2 // 高清倍数
      canvas.width = 375 * scale
      canvas.height = 667 * scale
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        toast.error('浏览器不支持 Canvas')
        return
      }

      // 设置高清渲染
      ctx.scale(scale, scale)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // 1. 绘制渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 375, 667)
      gradient.addColorStop(0, '#667eea')
      gradient.addColorStop(1, '#764ba2')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 375, 667)

      // 2. 绘制背景装饰圆圈（模拟模糊效果）
      // 右上角大圆
      const rightTopGradient = ctx.createRadialGradient(375, 0, 0, 375, 0, 60)
      rightTopGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
      rightTopGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = rightTopGradient
      ctx.beginPath()
      ctx.arc(375, 0, 60, 0, 2 * Math.PI)
      ctx.fill()

      // 左下角小圆
      const leftBottomGradient = ctx.createRadialGradient(0, 667, 0, 0, 667, 40)
      leftBottomGradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)')
      leftBottomGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = leftBottomGradient
      ctx.beginPath()
      ctx.arc(0, 667, 40, 0, 2 * Math.PI)
      ctx.fill()

      // 3. Logo 区域
      // Logo 背景圆
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.beginPath()
      ctx.arc(187.5, 60, 22.5, 0, 2 * Math.PI)
      ctx.fill()

      // Logo 文字 "MC"
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px Arial, sans-serif'
      ctx.fillText('MC', 187.5, 60)

      // 平台名称
      ctx.font = '12px Arial, sans-serif'
      ctx.fillText('MeetChances 面试平台', 187.5, 85)

      // 4. 候选人头像
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.beginPath()
      ctx.arc(187.5, 150, 50, 0, 2 * Math.PI)
      ctx.fill()

      // 头像文字
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 36px Arial, sans-serif'
      ctx.fillText(candidateName.charAt(0), 187.5, 150)

      // 5. 候选人姓名
      ctx.font = 'bold 32px Arial, sans-serif'
      ctx.fillText(candidateName, 187.5, 225)

      // 6. 职位信息
      ctx.font = '16px Arial, sans-serif'
      ctx.fillText(`${position} 面试报告`, 187.5, 250)

      // 7. 得分背景框
      const boxWidth = 280
      const boxHeight = 120
      const boxX = (375 - boxWidth) / 2
      const boxY = 290

      // 绘制圆角矩形背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.beginPath()
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 20)
      ctx.fill()

      // 绘制边框
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.stroke()

      // 8. 得分文字
      ctx.fillStyle = '#ffffff'
      ctx.font = '14px Arial, sans-serif'
      ctx.fillText('综合得分', 187.5, 315)

      // 得分数字和单位 - 调整位置让它们更紧密
      ctx.font = 'bold 72px Arial, sans-serif'
      const scoreText = score.toString()
      const scoreWidth = ctx.measureText(scoreText).width
      
      // 绘制得分数字（稍微左移）
      ctx.fillText(scoreText, 187.5 - 15, 360)
      
      // 绘制"分"字（紧贴数字右侧）
      ctx.font = '28px Arial, sans-serif'
      ctx.fillText('分', 187.5 - 15 + scoreWidth/2 + 20, 360)

      // 得分等级 - 位置稍微下移
      ctx.font = 'bold 20px Arial, sans-serif'
      ctx.fillText(getScoreLevel(score), 187.5, 390)

      // 9. 面试信息
      ctx.font = '14px Arial, sans-serif'
      ctx.fillText(`面试时间: ${date}`, 187.5, 480)
      ctx.fillText('AI 智能评估 · 专业可靠', 187.5, 500)

      // 10. 底部装饰线
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.fillRect(137.5, 630, 100, 3)

      // 直接下载海报
      const link = document.createElement('a')
      link.download = `${candidateName}-面试报告-${date}.png`
      link.href = canvas.toDataURL('image/png', 1.0)
      link.click()

      toast.success('海报下载成功！')
    } catch (error) {
      console.error('下载失败:', error)
      toast.error('下载失败，请重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Share2 className='h-5 w-5' />
            分享面试报告
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* 海报预览 */}
          <div className='flex justify-center'>
            <div className='border-2 border-gray-200 rounded-lg overflow-hidden'>
              <div
                ref={posterRef}
                className='relative'
                style={{
                  width: '375px',
                  height: '667px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontFamily: 'Arial, sans-serif',
                  color: '#ffffff',
                }}
              >
                {/* 背景装饰 */}
                <div 
                  className='absolute right-0 top-0 rounded-full'
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    filter: 'blur(30px)' 
                  }} 
                />
                <div 
                  className='absolute left-0 bottom-0 rounded-full'
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                    filter: 'blur(20px)' 
                  }} 
                />

                {/* 内容区域 */}
                <div className='relative z-10 flex flex-col items-center h-full px-8 py-10 text-center'>
                  {/* Logo 区域 */}
                  <div className='mb-6'>
                    <div 
                      className='flex items-center justify-center w-11 h-11 rounded-full mb-2 mx-auto'
                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    >
                      <span className='text-lg font-bold text-white'>MC</span>
                    </div>
                    <p className='text-xs text-white opacity-90 m-0'>MeetChances 面试平台</p>
                  </div>

                  {/* 候选人头像 */}
                  <div 
                    className='flex items-center justify-center w-25 h-25 rounded-full mb-5'
                    style={{ 
                      width: '100px', 
                      height: '100px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)' 
                    }}
                  >
                    <span className='text-4xl font-bold text-white'>{candidateName.charAt(0)}</span>
                  </div>

                  {/* 候选人姓名 */}
                  <h2 className='text-3xl font-bold text-white mb-1'>{candidateName}</h2>
                  <p className='text-base text-white opacity-90 mb-9'>{position} 面试报告</p>

                  {/* 得分展示 */}
                  <div 
                    className='rounded-2xl p-9 mb-9 border max-w-xs w-full'
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderColor: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <p className='text-sm text-white opacity-90 mb-3'>综合得分</p>
                    <div className='flex items-baseline justify-center gap-2 mb-3'>
                      <span 
                        className='font-bold text-white'
                        style={{ fontSize: '72px', lineHeight: '0.8' }}
                      >
                        {score}
                      </span>
                      <span className='text-3xl text-white opacity-90'>分</span>
                    </div>
                    <p className='text-xl font-semibold text-white m-0'>{getScoreLevel(score)}</p>
                  </div>

                  {/* 面试信息 */}
                  <div className='text-sm opacity-90 mb-6'>
                    <p className='text-white mb-1'>面试时间: {date}</p>
                    <p className='text-white m-0'>AI 智能评估 · 专业可靠</p>
                  </div>

                  {/* 底部装饰 */}
                  <div className='mt-auto'>
                    <div 
                      className='rounded-sm'
                      style={{ 
                        width: '100px', 
                        height: '3px', 
                        backgroundColor: 'rgba(255, 255, 255, 0.4)' 
                      }} 
                    />
                  </div>
                </div>
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
              下载海报
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
