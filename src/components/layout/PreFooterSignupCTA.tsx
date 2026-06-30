'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCustomerSession } from '@/lib/customer-auth'
import GsapReveal from '@/components/GsapReveal'
import { useLocale } from '@/components/LocaleProvider'

export default function PreFooterSignupCTA() {
  const pathname = usePathname()
  const session = useCustomerSession()
  const { href, t } = useLocale()
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false)

  if (!mounted || pathname.startsWith('/products/') || pathname.startsWith('/my-account') || pathname === '/login' || pathname === '/signup' || pathname === '/checkout') return null

  return (
    <section className="relative w-full bg-[#FAF6F3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 pb-7 sm:pb-8 lg:pb-9">
        {/* Decorative sitting rabbit — overlaps into footer */}
        <div className="absolute left-2 bottom-0 h-36 w-36 translate-y-[21%] pointer-events-none select-none sm:left-8 sm:h-52 sm:w-52 lg:left-12 lg:h-72 lg:w-72 z-10">
          <img
            src="/assets/gather/sitting-rabbit.webp"
            alt=""
            className="w-full h-full object-contain object-left-bottom"
            aria-hidden
          />
        </div>

        <GsapReveal className="max-w-2xl mx-auto text-center" y={18}>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight gather-brand-ar">{t('prefooter.join')} <span className="text-[#FE7501]">{t('prefooter.family')}</span></h2>
          <p className="mt-3 text-sm sm:text-base font-bold leading-relaxed text-[#7a6247]">
            {t('prefooter.cta')}
          </p>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
            <Link
              href={href(session ? '/my-account' : '/signup')}
              className="gather-btn-primary px-7 py-3 text-sm shadow-lg"
            >
              {t('prefooter.signUp')}
            </Link>
            <Link href={href('/my-account')} className="gather-btn-secondary px-7 py-3 text-sm">
              {t('footer.myAccount')}
            </Link>
          </div>
        </GsapReveal>
      </div>
    </section>
  )
}

function subscribeToMount(onStoreChange: () => void) {
  onStoreChange()
  return () => {}
}
