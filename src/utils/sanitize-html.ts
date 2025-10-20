/**
 * 简单的 HTML 清理函数
 * 只允许特定的安全标签和属性
 */
export function sanitizeHTML(html: string): string {
  // 创建一个临时 DOM 元素
  const temp = document.createElement('div')
  temp.innerHTML = html

  // 允许的标签
  const allowedTags = ['a', 'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'span', 'div']
  
  // 允许的属性
  const allowedAttrs: Record<string, string[]> = {
    a: ['href', 'target', 'rel'],
  }

  // 递归清理节点
  function cleanNode(node: Element): void {
    const tagName = node.tagName.toLowerCase()

    // 如果标签不在允许列表中，移除它（但保留其内容）
    if (!allowedTags.includes(tagName)) {
      const fragment = document.createDocumentFragment()
      while (node.firstChild) {
        fragment.appendChild(node.firstChild)
      }
      node.parentNode?.replaceChild(fragment, node)
      return
    }

    // 清理属性
    const attrs = Array.from(node.attributes)
    attrs.forEach((attr) => {
      const allowed = allowedAttrs[tagName] || []
      if (!allowed.includes(attr.name)) {
        node.removeAttribute(attr.name)
      }
    })

    // 对于 a 标签，确保安全属性
    if (tagName === 'a') {
      const href = node.getAttribute('href')
      if (href && href.startsWith('javascript:')) {
        node.removeAttribute('href')
      }
      // 外部链接添加安全属性
      if (href && href.startsWith('http')) {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer')
      }
    }

    // 递归处理子节点
    Array.from(node.children).forEach((child) => {
      cleanNode(child as Element)
    })
  }

  // 清理所有子节点
  Array.from(temp.children).forEach((child) => {
    cleanNode(child as Element)
  })

  return temp.innerHTML
}

