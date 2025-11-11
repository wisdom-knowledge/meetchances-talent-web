import { useRef, useEffect } from 'react'
import { toast } from 'sonner'
import posterBg from '@/features/referral/images/poster.jpg'

interface PosterData {
  totalIncome: number
  currentMonthIncome: number
  inviteCode: string
  userName?: string
}

interface PosterGeneratorProps {
  data: PosterData
  onGenerated?: (dataUrl: string) => void
}

export default function PosterGenerator({ data, onGenerated }: PosterGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isGeneratingRef = useRef(false)

  useEffect(() => {
    // 防止重复生成
    if (isGeneratingRef.current) {
      return
    }
    isGeneratingRef.current = true
    generatePoster()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const generatePoster = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      // 加载背景图
      const bgImage = new Image()
      bgImage.crossOrigin = 'anonymous'
      
      await new Promise((resolve, reject) => {
        bgImage.onload = resolve
        bgImage.onerror = reject
        bgImage.src = posterBg
      })

      // 使用背景图的原始尺寸设置画布
      canvas.width = bgImage.width
      canvas.height = bgImage.height

      // 绘制背景图（使用原始尺寸）
      ctx.drawImage(bgImage, 0, 0)

      // 设置字体渲染质量
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // 计算缩放比例（如果底图不是750宽度）
      const scale = canvas.width / 750

      // 绘制收益金额 (稍微加粗，"元"字更小，底对齐)
      const incomeYuan = (data.totalIncome / 100).toFixed(0)
      const numberPart = `+${incomeYuan}`
      
      // 设置数字部分字体并测量宽度
      const numberFontSize = Math.round(110 * scale)
      ctx.font = `600 ${numberFontSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
      const numberWidth = ctx.measureText(numberPart).width
      
      // 设置"元"字字体并测量宽度（更小，约为数字的45%）
      const yuanFontSize = Math.round(50 * scale)
      ctx.font = `600 ${yuanFontSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
      const yuanWidth = ctx.measureText('元').width
      
      // 计算间距和总宽度
      const spacing = 8 * scale // 数字和"元"字之间的间距
      const totalWidth = numberWidth + spacing + yuanWidth
      const centerX = canvas.width / 2
      const startX = centerX - totalWidth / 2
      
      // 绘制数字部分（使用 alphabetic 基线，向下移动20px）
      ctx.font = `600 ${numberFontSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(numberPart, startX, 260 * scale)
      
      // 绘制"元"字（更小的字号，底对齐）
      ctx.font = `600 ${yuanFontSize}px -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
      ctx.textBaseline = 'alphabetic' // 底对齐
      ctx.fillText('元', startX + numberWidth + spacing, 260 * scale)

      // 绘制内推码 (在底部白色区域右侧，8位，往下移动)
      const testInviteCode = 'AB9C2XTT' // 测试用写死的内推码（8位）
      
      // 设置内推码样式（字号缩小）
      ctx.font = `bold ${Math.round(44 * scale)}px -apple-system, BlinkMacSystemFont, Arial, sans-serif`
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'alphabetic'
      
      // 内推码位置：底部白色区域，更靠右，再向下移动5px
      const codeX = canvas.width - (35 * scale)
      const codeY = canvas.height - (30 * scale)
      ctx.fillText(testInviteCode, codeX, codeY)
      
      console.log('海报生成完成', {
        canvasSize: `${canvas.width}x${canvas.height}`,
        scale,
        inviteCode: testInviteCode,
        incomeYuan,
        incomePosition: `x: ${canvas.width / 2}, y: ${240 * scale}`,
        codePosition: `x: ${codeX}, y: ${codeY}`
      })

      // 生成图片URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      onGenerated?.(dataUrl)
    } catch (error) {
      console.error('生成海报失败:', error)
      toast.error('生成海报失败，请稍后重试')
    } finally {
      // 重置生成标志
      isGeneratingRef.current = false
    }
  }

  return <canvas ref={canvasRef} className='hidden' />
}

