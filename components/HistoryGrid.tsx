import React from 'react';
import type { HistoryEntry } from '../types';
import { TrashIcon, PlayIcon } from './icons';

interface HistoryGridProps {
  history: HistoryEntry[];
  onSelectVideo: (video: HistoryEntry['video']) => void;
  onClearHistory: () => void;
}

export const HistoryGrid: React.FC<HistoryGridProps> = ({ history, onSelectVideo, onClearHistory }) => {
  if (!history || history.length === 0) {
    return null;
  }

  return (
    <section className="mb-12 animate-fadeIn">
      <div className="flex justify-between items-end mb-6">
        <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-primary rounded-full shadow-sm shadow-primary/50"></div>
            <h2 className="text-2xl font-bold text-text-primary tracking-tight">继续观看</h2>
        </div>
        <button
          onClick={onClearHistory}
          className="flex items-center space-x-1.5 text-xs text-text-secondary hover:text-red-500 transition-colors font-medium px-3 py-1.5 rounded-full hover:bg-red-50 border border-transparent hover:border-red-100 active:scale-95"
        >
          <TrashIcon className="w-3.5 h-3.5" />
          <span>清空记录</span>
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {history.map((entry) => (
          <div
            key={`${entry.video.sourceId}-${entry.video.id}-${entry.lastWatched}`}
            onClick={() => onSelectVideo(entry.video)}
            className="group relative flex flex-col cursor-pointer"
          >
            {/* Aspect Ratio 2:3 */}
            <div className="relative aspect-[2/3] bg-surface rounded-2xl overflow-hidden shadow-sm group-hover:shadow-2xl group-hover:shadow-primary/15 transition-all duration-300 ease-out group-hover:-translate-y-1.5 ring-1 ring-black/5 group-hover:ring-primary/30 z-0">
              <img
                src={entry.video.thumbnailUrl}
                alt={entry.video.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                loading="lazy"
                onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450.png?text=No+Image';
                }}
              />
              
              {/* Gradient Overlay - Always visible but stronger on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
              
              {/* Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 transform scale-75 group-hover:scale-100">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/40 shadow-2xl hover:bg-primary hover:border-primary transition-colors">
                    <PlayIcon className="w-6 h-6 ml-0.5 fill-white" />
                </div>
              </div>

              {/* Progress Bar and Episode Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                 <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[10px] text-white/90 font-bold truncate pr-2">
                        {entry.episodeName}
                    </p>
                    <span className="text-[9px] text-white/60 font-mono">
                        {new Date(entry.lastWatched).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}
                    </span>
                 </div>
                 <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div className="h-full bg-primary w-3/4 rounded-full shadow-sm shadow-primary"></div>
                 </div>
              </div>
            </div>
            
            <div className="mt-3 px-1">
              <h3 className="font-bold text-sm text-text-primary truncate group-hover:text-primary transition-colors duration-300">{entry.video.title}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                   <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                   <p className="text-xs text-text-secondary opacity-80">上次看到这里</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};