import type { TextBlockSectionProps } from '@/types'

export default function TextBlockSection({ title, content, align = 'left' }: TextBlockSectionProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : align === 'right' ? 'text-right ml-auto' : ''

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={`max-w-3xl ${alignClass}`}>
        {title && <h2 className="text-2xl sm:text-3xl font-black text-[#171717] mb-4">{title}</h2>}
        <div className="prose prose-sm sm:prose text-gray-600 leading-relaxed">
          {content.split('\n').map((paragraph, i) =>
            paragraph.trim() ? (
              <p key={i} className="mb-4">
                {paragraph}
              </p>
            ) : null
          )}
        </div>
      </div>
    </section>
  )
}
