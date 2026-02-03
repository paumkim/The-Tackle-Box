
import React, { useEffect } from 'react';
import { useAppStore } from '../store';
import { CloudRain, Sun, Cloud, CloudFog, CloudLightning, Wind, Navigation, AlertCircle, Compass, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';

export const WeatherGlass: React.FC = () => {
  const weatherData = useAppStore(state => state.weatherData);
  const weatherCondition = useAppStore(state => state.weatherCondition);
  const locationEnabled = useAppStore(state => state.locationEnabled);
  const calibrateSextant = useAppStore(state => state.calibrateSextant);
  const signalStatus = useAppStore(state => state.signalStatus);
  const fetchWeather = useAppStore(state => state.fetchWeather);
  const unitSystem = useAppStore(state => state.unitSystem);

  useEffect(() => {
      if (locationEnabled && !weatherData) {
          fetchWeather();
      }
  }, [locationEnabled, weatherData, fetchWeather]);

  const getWeatherIcon = () => {
      switch(weatherCondition) {
          case 'RAIN': return CloudRain;
          case 'STORM': return CloudLightning;
          case 'FOG': return CloudFog;
          case 'SNOW': return CloudFog; 
          default: return Sun;
      }
  };

  const getSeaState = (windKnots: number) => {
      if (windKnots < 5) return 'Glassy';
      if (windKnots < 15) return 'Choppy';
      if (windKnots < 25) return 'Rough';
      return 'Heaving';
  };

  const Icon = getWeatherIcon();

  const handleEnableLocation = () => {
      calibrateSextant();
  };

  if (!locationEnabled && signalStatus === 'OFFLINE') {
      return (
        <div className="bg-white p-6 rounded-xl border-2 border-dashed border-stone-300 shadow-sm flex flex-col items-center justify-center h-full relative overflow-hidden text-center group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply"></div>
            
            <Compass className="w-8 h-8 text-stone-300 mb-2" />
            <h3 className="text-stone-500 text-xs font-serif font-bold uppercase tracking-wider mb-2">
                Sensor Offline
            </h3>
            
            <button 
                onClick={handleEnableLocation}
                className="text-xs bg-slate-800 text-white px-4 py-2 rounded-sm font-bold hover:bg-slate-700 transition-colors shadow-md font-serif tracking-wide border border-slate-900 z-10"
            >
                Calibrate Sextant
            </button>
        </div>
      );
  }

  // Calculate Display Temperature
  let displayTemp = weatherData?.temperature || 0;
  if (unitSystem === 'IMPERIAL' && weatherData) {
      displayTemp = (weatherData.temperature * 9/5) + 32;
  }

  // Fallback or Active Data Render
  return (
    <div className="bg-white p-6 rounded-xl border border-[#E0E0E0] shadow-[2px_4px_12px_rgba(0,0,0,0.05)] flex flex-col h-full relative overflow-hidden group">
      {/* Paper Texture Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 mix-blend-multiply pointer-events-none"></div>
      
      {/* Hand-Drawn Sketch Markings (SVG) */}
      <svg className="absolute top-0 right-0 w-24 h-24 opacity-10 pointer-events-none" viewBox="0 0 100 100">
          <circle cx="100" cy="0" r="80" stroke="black" strokeWidth="1" fill="none" strokeDasharray="4 4" />
          <circle cx="100" cy="0" r="70" stroke="black" strokeWidth="0.5" fill="none" />
      </svg>

      {/* Header */}
      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-slate-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2 font-serif border-b-2 border-stone-200 pb-1">
            <Icon className={`w-3 h-3 ${weatherCondition === 'CLEAR' ? 'animate-spin-slow' : ''}`} />
            Met. Station
            {/* Signal Status Dot */}
            <div 
                className={`w-2 h-2 rounded-full ml-1 ${
                    signalStatus === 'LOCKED' ? 'bg-emerald-500 animate-pulse' : 
                    signalStatus === 'FALLBACK' ? 'bg-amber-500' : 'bg-red-500'
                }`} 
                title={`GPS Signal: ${signalStatus}`}
            ></div>
          </h3>
          <p className="text-[10px] text-stone-400 font-mono mt-1">
              {signalStatus === 'FALLBACK' ? 'HOME PORT FALLBACK' : 'LOCAL ATMOSPHERICS'}
          </p>
        </div>
        
        {/* Warning Indicator for Storms (Red Ink Stamp) */}
        {weatherCondition === 'STORM' && (
            <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-red-700 border-2 border-red-700 rounded-full p-1"
                title="Storm Warning"
            >
                <AlertCircle className="w-4 h-4" />
            </motion.div>
        )}
      </div>

      {/* Main Stats (Ink Style) */}
      <div className="flex items-end gap-4 mt-auto mb-2 z-10">
          {weatherData ? (
              <>
                <div className="relative">
                    <span className="text-5xl font-bold text-slate-800 font-serif leading-none tracking-tight">
                        {Math.round(displayTemp)}°
                    </span>
                    <span className="text-xs font-bold text-slate-400 absolute -top-1 -right-3">
                        {unitSystem === 'IMPERIAL' ? 'F' : 'C'}
                    </span>
                </div>
                
                <div className="h-8 w-px bg-stone-300 transform rotate-12"></div>
                
                <div className="flex flex-col mb-1">
                    <span className="text-xl font-bold text-slate-700 font-mono leading-none">
                        {Math.round(weatherData.windSpeed)}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Knots</span>
                </div>
              </>
          ) : (
              <span className="text-sm text-slate-400 italic">Calibrating...</span>
          )}
      </div>

      {/* Sea State Indicator */}
      {weatherData && (
          <div className="absolute bottom-4 right-4 z-10 text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sea State</div>
              <div className={`text-xs font-bold font-serif ${weatherData.windSpeed > 15 ? 'text-blue-600' : 'text-slate-600'}`}>
                  {getSeaState(weatherData.windSpeed)}
              </div>
          </div>
      )}

      {/* Animated Atmospheric Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {/* Rain / Storm */}
          {weatherCondition === 'RAIN' && (
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-10 animate-grain mix-blend-multiply"></div>
          )}
          {weatherCondition === 'STORM' && (
              <div className="absolute inset-0 bg-slate-900/10 mix-blend-overlay"></div>
          )}
          
          {/* Drifting Clouds (Graphite) */}
          {(weatherCondition === 'FOG' || weatherCondition === 'RAIN' || weatherCondition === 'STORM') && (
              <>
                <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-10 left-0 w-full h-12 bg-gradient-to-r from-transparent via-stone-200/30 to-transparent blur-md"
                ></motion.div>
                <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear', delay: 2 }}
                    className="absolute top-20 left-0 w-full h-8 bg-gradient-to-r from-transparent via-stone-300/20 to-transparent blur-sm"
                ></motion.div>
              </>
          )}
      </div>
    </div>
  );
};
