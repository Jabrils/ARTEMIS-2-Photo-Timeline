export default function PromoWidget() {
  return (
    <div className="absolute bottom-60 right-2 sm:bottom-64 sm:right-4 w-56 sm:w-64 pointer-events-auto z-[var(--z-hud)] bg-[rgba(10,10,30,0.85)] backdrop-blur-sm border border-[rgba(0,212,255,0.2)] rounded-lg overflow-hidden">
      <div className="px-3 pt-2 pb-2">
        <p className="text-[10px] text-gray-300 leading-snug">
          Like this tool? Support my work by{' '}
          <a href="https://jabrils.com" target="_blank" rel="noopener noreferrer" className="text-[#00d4ff]/70 hover:text-[#00d4ff] underline transition-colors">
            playing my game &amp; watch my youtube
          </a>.
        </p>
      </div>
      {/* Hero image — replace src with your image */}
      <a href="https://jabrils.com" target="_blank" rel="noopener noreferrer" className="block w-full aspect-video bg-[rgba(0,212,255,0.05)] border-y border-[rgba(0,212,255,0.1)] cursor-pointer">
        <img
          src="/promo-hero.png"
          alt="Support my work"
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </a>
      <div className="px-3 pt-2 pb-2">
        <p className="text-[9px] text-gray-500">
          This project is inspired by{' '}
          <a
            href="https://artemistimeline.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00d4ff]/70 hover:text-[#00d4ff] underline transition-colors"
          >
            artemistimeline.com
          </a>
        </p>
      </div>
    </div>
  );
}
