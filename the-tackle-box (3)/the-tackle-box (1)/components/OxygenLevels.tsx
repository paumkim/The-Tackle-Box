import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Droplets, Wind, RefreshCw } from 'lucide-react';
import { db } from '../db';

export const OxygenLevels: React.FC = () => {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  const staleNotes = useLiveQuery(
    () => db.notes.where('updatedAt').below(thirtyDaysAgo).toArray()
  );

  if (!staleNotes || staleNotes.length === 0) return null;

  return (
    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
          <Wind className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-900">Low Oxygen Detected</h4>
          <p className="text-xs text-emerald-700">
            {staleNotes.length} items in the tank haven't been touched in 30 days.
          </p>
        </div>
      </div>
      <button className="text-xs bg-white text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-md font-medium hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center">
        <RefreshCw className="w-3 h-3 mr-1.5" />
        Oxygenate (Archive)
      </button>
    </div>
  );
};