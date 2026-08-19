export function SpaceBackground() {
  return (
    <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden bg-[#0a0e1a]">
      {/* Studio Blueprint Dot Grid */}
      <div 
        className="absolute inset-0 opacity-[0.18]" 
        style={{ 
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} 
      />

      {/* Subtle Creative Ambient Lighting */}
      <div className="absolute -top-[15%] left-[10%] w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute top-[30%] -right-[10%] w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-cyan-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-[15%] left-[20%] w-[500px] sm:w-[700px] h-[500px] sm:h-[700px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Soft Vignette Overlay */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#0a0e1a]/40 to-[#0a0e1a]/90 pointer-events-none" />
    </div>
  );
}
