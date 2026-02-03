import React from 'react';
import { WeatherCondition } from '../types';

export const WeatherLayer: React.FC<{ condition: WeatherCondition }> = React.memo(({ condition }) => {
    if (condition === 'CLEAR') return null;

    return (
        <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden will-change-transform">
            {/* THE MIST (Fog) - Updated for Transparent Hull Protocol: removed blur */}
            {(condition === 'FOG' || condition === 'RAIN') && (
                <div className="absolute inset-0 bg-white/10">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-100/20 via-transparent to-slate-100/20 animate-current opacity-30 will-change-transform"></div>
                    {condition === 'RAIN' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-5 mix-blend-multiply will-change-transform"></div>}
                </div>
            )}

            {/* STORM SURGE */}
            {condition === 'STORM' && (
                <div className="absolute inset-0 bg-slate-900/20 mix-blend-overlay">
                    <div className="absolute inset-0 bg-black/5 animate-pulse"></div>
                    {/* Lightning Flashes */}
                    <div className="absolute inset-0 bg-white opacity-0 animate-[ping_5s_infinite]"></div>
                </div>
            )}
        </div>
    );
});
