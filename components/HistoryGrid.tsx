import React from 'react';
import type { HistoryEntry } from '../types';
import { TrashIcon } from './icons';

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
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4 border-b-2 border-primary pb-2">
        <h2 className="text-2xl font-bold text-text-primary">观看记录</h2>
        <button
          onClick={onClearHistory}
          className="flex items-center space-x-2 text-sm text-red-500 hover:text-red-700 transition-colors font-medium px-3 py-1 rounded-md hover:bg-red-50"
        >
          <TrashIcon className="w-4 h-4" />
          <span>清空记录</span>
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {history.map((entry) => (
          <div
            key={`${entry.video.sourceId}-${entry.video.id}-${entry.lastWatched}`}
            onClick={() => onSelectVideo(entry.video)}
            className="group cursor-pointer transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.03]"
          >
            <div className="relative aspect-[2/3] bg-surface rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
              <img
                src={entry.video.thumbnailUrl}
                alt={entry.video.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-2 text-white">
                <p className="text-xs font-semibold">上次看到: {entry.episodeName}</p>
              </div>
            </div>
            <div className="pt-2">
              <h3 className="font-semibold text-sm truncate text-text-primary">{entry.video.title}</h3>
              <p className="text-xs text-text-secondary">{new Date(entry.lastWatched).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};