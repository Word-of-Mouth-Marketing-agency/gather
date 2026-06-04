export default function WaveBrushDivider() {
  return (
    <div className="w-full overflow-hidden leading-none -mb-[2px]">
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="w-full h-[60px] sm:h-[80px]"
        aria-hidden
      >
        <path
          d="M0,40 Q120,0 240,20 Q360,40 480,25 Q600,10 720,35 Q840,60 960,40 Q1080,20 1200,30 Q1320,40 1440,20 L1440,80 L0,80 Z"
          fill="#FDF6EE"
        />
        <path
          d="M0,50 Q100,30 220,40 Q340,50 460,35 Q580,20 700,45 Q820,70 940,50 Q1060,30 1180,40 Q1300,50 1440,30 L1440,80 L0,80 Z"
          fill="#FCECDC"
          opacity="0.5"
        />
      </svg>
    </div>
  )
}
