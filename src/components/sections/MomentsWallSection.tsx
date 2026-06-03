import type { MomentsWallSectionProps } from '@/types'

const MOCK_MOMENTS = Array.from({ length: 8 }, (_, i) => ({
  id: `moment-${i + 1}`,
  src: `/images/moments/moment-${i + 1}.jpg`,
  alt: `Gather Moment ${i + 1}`,
}))

export default function MomentsWallSection({ title, subtitle, limit = 8 }: MomentsWallSectionProps) {
  const moments = MOCK_MOMENTS.slice(0, limit)

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-[#171717]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[#7a6247]">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {moments.map((moment) => (
          <MomentCard key={moment.id} src={moment.src} alt={moment.alt} />
        ))}
      </div>
    </section>
  )
}

function MomentCard({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-square rounded-[22px] overflow-hidden bg-[#f5f5f5] shadow-[0_10px_28px_rgba(0,0,0,0.08)] group">
      <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-300">📸</div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
      />
    </div>
  )
}
