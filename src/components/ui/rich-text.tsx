import { cn } from '@/lib/utils'

interface RichTextProps {
  content: string
  className?: string
}

export function RichText({ content, className }: RichTextProps) {
  // 基本的HTML清理函数 - 移除潜在危险的标签和属性
  const sanitizeHTML = (html: string) => {
    // 移除script标签
    let cleaned = html.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ''
    )

    // 移除危险的事件处理器
    cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')

    // 移除javascript:链接
    cleaned = cleaned.replace(/javascript:/gi, '')

    // 统一移除有序列表的 type 属性（避免 a/A/i/I 等样式）
    cleaned = cleaned.replace(
      /<ol\b([^>]*?)\s*type\s*=\s*["'][^"']*["']([^>]*)>/gi,
      '<ol$1$2>'
    )

    return cleaned
  }

  // 检查内容是否包含HTML标签
  const hasHTMLTags = (text: string) => {
    // 检查是否包含HTML标签（简单的正则匹配）
    return /<[^>]+>/g.test(text)
  }

  // 处理换行符，将\n转换为<br>标签（仅在没有HTML标签时）
  const processLineBreaks = (text: string) => {
    if (hasHTMLTags(text)) {
      // 如果包含HTML标签，不处理换行符
      return text
    } else {
      // 如果是纯文本，将\n转换为<br>
      return text.replace(/\n/g, '<br>')
    }
  }

  const processedContent = processLineBreaks(content || '')
  const sanitizedContent = sanitizeHTML(processedContent)

  return (
    <div
      className={cn(
        'leading-relaxed',
        '[&_h1]:text-foreground [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold',
        '[&_h2]:text-foreground [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold',
        '[&_h3]:text-foreground [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium',
        '[&_p]:mb-3 [&_p]:leading-relaxed',
        '[&_li]:mb-1 [&_li]:leading-relaxed [&_ul]:mb-3 [&_ul]:pl-6 [&_ul]:list-disc [&_ul_ul]:list-[circle]',
        // 无序列表：一级实心圆，二级空心圆；有序列表：阿拉伯数字
        '[&_ol]:mb-3 [&_ol]:pl-6 [&_ol]:list-decimal [&_ol_ol]:list-decimal',
        '[&_strong]:text-foreground [&_strong]:font-semibold',
        '[&_em]:italic',
        '[&_a]:text-blue-600 [&_a]:underline hover:[&_a]:text-blue-800',
        '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic',
        '[&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-gray-100 [&_pre]:p-3',
        '[&_code]:rounded [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:text-sm',
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}
