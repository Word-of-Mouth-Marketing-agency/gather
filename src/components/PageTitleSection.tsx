import AnimatedTitle from './AnimatedTitle'

interface Props {
  title: string
  accentWord?: string
}

export default function PageTitleSection({ title, accentWord }: Props) {
  return (
    <section className="bg-[#F3E7D9] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-18 text-center">
        <AnimatedTitle
          as="h1"
          text={title}
          accentWord={accentWord}
          className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#171717]"
        />
      </div>
    </section>
  )
}
