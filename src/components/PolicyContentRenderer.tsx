interface Props {
  content: string
}

export default function PolicyContentRenderer({ content }: Props) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null

  const flushList = () => {
    if (!currentList) return
    const ListTag = currentList.type === 'ul' ? 'ul' : 'ol'
    elements.push(
      <ListTag
        key={`list-${elements.length}`}
        className={`${currentList.type === 'ul' ? 'list-disc' : 'list-decimal'} pl-5 mt-2 space-y-1`}
      >
        {currentList.items.map((item, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
        ))}
      </ListTag>
    )
    currentList = null
  }

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '') {
      flushList()
      continue
    }

    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold text-[#171717] mb-3">
          {trimmed.slice(3)}
        </h2>
      )
    } else if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-bold text-[#171717] mb-3">
          {trimmed.slice(2)}
        </h1>
      )
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!currentList || currentList.type !== 'ul') {
        flushList()
        currentList = { type: 'ul', items: [] }
      }
      currentList.items.push(trimmed.slice(2))
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!currentList || currentList.type !== 'ol') {
        flushList()
        currentList = { type: 'ol', items: [] }
      }
      currentList.items.push(trimmed.replace(/^\d+\.\s/, ''))
    } else {
      flushList()
      elements.push(
        <p key={`p-${i}`} dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />
      )
    }
  }

  flushList()

  return <>{elements}</>
}