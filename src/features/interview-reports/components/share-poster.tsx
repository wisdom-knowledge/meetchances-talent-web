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

  // 下载海报 - 从预览区域提取精确位置，1:1 还原
  const downloadPoster = async () => {
    try {
      if (!posterRef.current) {
        toast.error('预览区域未找到')
        return
      }

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

      // 获取预览区域的精确位置信息
      const posterRect = posterRef.current.getBoundingClientRect()
      const getElementPosition = (selector: string) => {
        const element = posterRef.current?.querySelector(selector)
        if (!element) return null
        const rect = element.getBoundingClientRect()
        return {
          x: rect.left - posterRect.left + rect.width / 2,
          y: rect.top - posterRect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
          top: rect.top - posterRect.top,
          bottom: rect.bottom - posterRect.top
        }
      }

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

      // 3. 使用 DOM 元素的精确位置绘制内容
      // Logo 背景圆
      const logoPos = getElementPosition('.poster-logo')
      if (logoPos) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.beginPath()
        ctx.arc(logoPos.x, logoPos.y, logoPos.width / 2, 0, 2 * Math.PI)
        ctx.fill()

        // Logo 文字
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 18px Arial, sans-serif'
        ctx.fillText('MC', logoPos.x, logoPos.y)
      }

      // 平台名称
      const platformPos = getElementPosition('.poster-platform')
      if (platformPos) {
        ctx.font = '12px Arial, sans-serif'
        ctx.fillText('MeetChances 面试平台', platformPos.x, platformPos.y)
      }

      // 候选人头像
      const avatarPos = getElementPosition('.poster-avatar')
      if (avatarPos) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.beginPath()
        ctx.arc(avatarPos.x, avatarPos.y, avatarPos.width / 2, 0, 2 * Math.PI)
        ctx.fill()

        // 头像文字
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 36px Arial, sans-serif'
        ctx.fillText(candidateName.charAt(0), avatarPos.x, avatarPos.y)
      }

      // 候选人姓名
      const namePos = getElementPosition('.poster-name')
      if (namePos) {
        ctx.font = 'bold 30px Arial, sans-serif'
        ctx.fillText(candidateName, namePos.x, namePos.y)
      }

      // 职位信息
      const positionPos = getElementPosition('.poster-position')
      if (positionPos) {
        ctx.font = '16px Arial, sans-serif'
        ctx.fillText(`${position} 面试报告`, positionPos.x, positionPos.y)
      }

      // 得分背景框
      const scoreBoxPos = getElementPosition('.poster-score-box')
      if (scoreBoxPos) {
        // 绘制圆角矩形背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.beginPath()
        ctx.roundRect(scoreBoxPos.x - scoreBoxPos.width / 2, scoreBoxPos.y - scoreBoxPos.height / 2, scoreBoxPos.width, scoreBoxPos.height, 16)
        ctx.fill()

        // 绘制边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // 得分标题
      const scoreHeaderPos = getElementPosition('.poster-score-header')
      if (scoreHeaderPos) {
        ctx.fillStyle = '#ffffff'
        ctx.font = '14px Arial, sans-serif'
        ctx.fillText('综合得分', scoreHeaderPos.x, scoreHeaderPos.y)
      }

      // 得分数字
      const scoreValuePos = getElementPosition('.poster-score-value')
      const scoreUnitPos = getElementPosition('.poster-score-unit')
      if (scoreValuePos) {
        ctx.font = 'bold 72px Arial, sans-serif'
        ctx.fillText(score.toString(), scoreValuePos.x, scoreValuePos.y)
      }
      if (scoreUnitPos) {
        ctx.font = '30px Arial, sans-serif'
        ctx.fillText('分', scoreUnitPos.x, scoreUnitPos.y)
      }

      // 得分等级
      const scoreLevelPos = getElementPosition('.poster-score-level')
      if (scoreLevelPos) {
        ctx.font = 'bold 20px Arial, sans-serif'
        ctx.fillText(getScoreLevel(score), scoreLevelPos.x, scoreLevelPos.y)
      }

      // 面试时间
      const datePos = getElementPosition('.poster-date')
      if (datePos) {
        ctx.font = '14px Arial, sans-serif'
        ctx.fillText(`面试时间: ${date}`, datePos.x, datePos.y)
      }

      // AI 标签
      const aiLabelPos = getElementPosition('.poster-ai-label')
      if (aiLabelPos) {
        ctx.font = '14px Arial, sans-serif'
        ctx.fillText('AI 智能评估 · 专业可靠', aiLabelPos.x, aiLabelPos.y)
      }

      // 底部装饰线（保持固定位置）
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.fillRect(137.5, 615, 100, 3)

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
                <div 
                  style={{
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    padding: '40px 32px',
                    textAlign: 'center'
                  }}
                >
                  {/* Logo 区域 */}
                  <div style={{ marginBottom: '24px' }}>
                    <div 
                      className="poster-logo"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        marginBottom: '8px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <span 
                        className="poster-logo-text"
                        style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#ffffff'
                        }}
                      >
                        MC
                      </span>
                    </div>
                    <p 
                      className="poster-platform"
                      style={{
                        fontSize: '12px',
                        color: '#ffffff',
                        opacity: 0.9,
                        margin: 0
                      }}
                    >
                      MeetChances 面试平台
                    </p>
                  </div>

                  {/* 候选人头像 */}
                  <div 
                    className="poster-avatar"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      marginBottom: '20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span 
                      className="poster-avatar-text"
                      style={{
                        fontSize: '36px',
                        fontWeight: 'bold',
                        color: '#ffffff'
                      }}
                    >
                      {candidateName.charAt(0)}
                    </span>
                  </div>

                  {/* 候选人姓名 */}
                  <h2 
                    className="poster-name"
                    style={{
                      fontSize: '30px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      marginBottom: '4px',
                      margin: '0 0 4px 0'
                    }}
                  >
                    {candidateName}
                  </h2>
                  <p 
                    className="poster-position"
                    style={{
                      fontSize: '16px',
                      color: '#ffffff',
                      opacity: 0.9,
                      marginBottom: '36px',
                      margin: '0 0 36px 0'
                    }}
                  >
                    {position} 面试报告
                  </p>

                  {/* 得分展示 */}
                  <div 
                    className="poster-score-box"
                    style={{
                      borderRadius: '16px',
                      padding: '36px',
                      marginBottom: '36px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      maxWidth: '288px',
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)'
                    }}
                  >
                    <p 
                      className="poster-score-header"
                      style={{
                        fontSize: '14px',
                        color: '#ffffff',
                        opacity: 0.9,
                        marginBottom: '12px',
                        margin: '0 0 12px 0'
                      }}
                    >
                      综合得分
                    </p>
                    <div 
                      className="poster-score-number"
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'center',
                        gap: '8px',
                        marginBottom: '12px'
                      }}
                    >
                      <span 
                        className="poster-score-value"
                        style={{
                          fontWeight: 'bold',
                          color: '#ffffff',
                          fontSize: '72px',
                          lineHeight: '0.8'
                        }}
                      >
                        {score}
                      </span>
                      <span 
                        className="poster-score-unit"
                        style={{
                          fontSize: '30px',
                          color: '#ffffff',
                          opacity: 0.9
                        }}
                      >
                        分
                      </span>
                    </div>
                    <p 
                      className="poster-score-level"
                      style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#ffffff',
                        margin: 0
                      }}
                    >
                      {getScoreLevel(score)}
                    </p>
                  </div>

                  {/* 面试信息 */}
                  <div 
                    className="poster-info"
                    style={{
                      fontSize: '14px',
                      opacity: 0.9,
                      marginBottom: '24px'
                    }}
                  >
                    <p 
                      className="poster-date"
                      style={{
                        color: '#ffffff',
                        marginBottom: '4px',
                        margin: '0 0 4px 0'
                      }}
                    >
                      面试时间: {date}
                    </p>
                    <p 
                      className="poster-ai-label"
                      style={{
                        color: '#ffffff',
                        margin: 0
                      }}
                    >
                      AI 智能评估 · 专业可靠
                    </p>
                  </div>

                  {/* 底部装饰 */}
                  <div style={{ marginTop: 'auto' }}>
                    <div 
                      style={{
                        borderRadius: '2px',
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
