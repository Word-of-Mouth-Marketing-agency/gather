import Link from 'next/link'
import type { OffersGridSectionProps } from '@/types'

const OFFERS = [
  {
    id: 'offer-1',
    title: 'Birthday Bundle',
    description: 'Cake + Flowers + Chocolate — Save 20%',
    image: '/assets/gather/categories/cakes-pastry.png',
    link: '/shop-by-category/chocolate',
  },
  {
    id: 'offer-2',
    title: 'Party Pack',
    description: 'Decorations + Costumes + Candies — Save 15%',
    image: '/assets/gather/categories/celebration-stuff.webp',
    link: '/shop-by-category/decorations',
  },
  {
    id: 'offer-3',
    title: 'Snack Combo',
    description: 'Baked Snacks + Salty Snacks + Drinks — Save 25%',
    image: '/assets/gather/categories/baked-snacks.png',
    link: '/shop-by-category/baked-snacks',
  },
  {
    id: 'offer-4',
    title: 'Sweet Treat',
    description: 'Chocolate + Candies + Nuts — Save 10%',
    image: '/assets/gather/categories/chocolate.png',
    link: '/shop-by-category/chocolate',
  },
]

export default function OffersGridSection({ title, subtitle }: OffersGridSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-[#171717]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[#7a6247]">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {OFFERS.map((offer) => (
          <Link
            key={offer.id}
            href={offer.link}
            className="group rounded-2xl overflow-hidden bg-white border border-[#f1e2d3] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-[rgba(255,122,26,0.4)]"
          >
            <div className="aspect-[4/3] bg-[#fff4e8] flex items-center justify-center p-6">
              <img
                src={offer.image}
                alt={offer.title}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="font-bold text-[#171717]">{offer.title}</h3>
              <p className="text-sm text-[#7a6247] mt-1">{offer.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
