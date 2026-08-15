export function SpaceBackground() {
   return (
      <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden bg-[#050914]">
         {/* Subtle deep blue/black mesh/gradient background */}
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050914] to-black opacity-80" />
         
         {/* A very subtle abstract glow to keep it from being completely flat, but NO stars/spots */}
         <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />
      </div>
   );
}
