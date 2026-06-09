import AnimatedTitle from './AnimatedTitle'

interface Props {
  title: string
  accentWord?: string
}

export default function PageTitleSection({ title, accentWord }: Props) {
  return (
    <section className="bg-[#F3E7D9] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center">
        <AnimatedTitle
          as="h1"
          text={title}
          accentWord={accentWord}
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#171717]"
        />
      </div>
    </section>
  )
}
