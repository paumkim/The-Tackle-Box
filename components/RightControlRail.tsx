
import React from 'react';
import { TheBallast } from './TheBallast';
import { ResponseBallast } from './ResponseBallast';
import { TimeLog } from './TimeLog';

export const RightControlRail: React.FC = () => {
  return (
    <aside className="w-[80px] flex-shrink-0 bg-[#fdfbf7] h-full flex flex-col items-center justify-between py-6 z-30 relative shadow-[inset_3px_0_6px_rgba(0,0,0,0.08)] border-l border-stone-300">
       {/* Paper Texture Overlay */}
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-60 mix-blend-multiply pointer-events-none"></div>

       {/* Top: Focus Bell - Pushed down slightly for visual balance */}
       <div className="flex-shrink-0 relative z-10 w-full px-2 mt-4">
           <TheBallast />
       </div>
       
       {/* Structural Divider (Ink Line) */}
       <div className="w-12 h-px bg-stone-300 my-4 relative z-10 opacity-50"></div>

       {/* Middle: Vertical Ballast Slider - Perfectly Centered */}
       <div className="flex-1 flex flex-col justify-center relative z-10 w-full px-2">
           <ResponseBallast />
       </div>
       
       {/* Structural Divider (Ink Line) */}
       <div className="w-12 h-px bg-stone-300 my-4 relative z-10 opacity-50"></div>

       {/* Bottom: Start Watch Button */}
       <div className="flex-shrink-0 mb-4 relative z-10 w-full flex justify-center">
           <TimeLog />
       </div>
    </aside>
  )
}
