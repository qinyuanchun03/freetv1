import React from 'react';
import type { Video } from '../types';
import { PlayIcon } from './icons';

interface VideoGridProps {
  groupedVideos: Record<string, Video[]>;
  onSelectVideo: (video: Video) => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({ groupedVideos, onSelectVideo }) => {
  const sources = Object.keys(groupedVideos);

  return (
    <div className="space-y-12 pb-12">
      {sources.map(sourceName => (
        <section key={sourceName} className="animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-1.5 h-6 bg-primary rounded-full shadow-sm shadow-primary/50"></div>
             <h2 className="text-2xl font-bold text-text-primary tracking-tight">{sourceName}</h2>
             <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 rounded-lg text-text-secondary border border-gray-200">{groupedVideos[sourceName].length}</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {groupedVideos[sourceName].map((video) => (
              <div
                key={`${video.sourceId}-${video.id}`}
                onClick={() => onSelectVideo(video)}
                className="group relative flex flex-col cursor-pointer"
              >
                {/* Image Container - Standard Poster Ratio 2:3 */}
                <div className="relative aspect-[2/3] bg-surface rounded-2xl overflow-hidden shadow-sm group-hover:shadow-2xl group-hover:shadow-primary/15 transition-all duration-300 ease-out group-hover:-translate-y-1.5 ring-1 ring-black/5 group-hover:ring-primary/30 z-0">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450.png?text=No+Image';
                    }}
                  />
                  
                  {/* Modern Dark Overlay - Radial Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Centered Play Button Overlay with bounce effect */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 delay-75 transform scale-75 group-hover:scale-100">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/40 shadow-2xl group-hover:animate-[pulse_2s_infinite] hover:bg-primary hover:border-primary transition-colors">
                        <PlayIcon className="w-7 h-7 ml-1 fill-white" />
                    </div>
                  </div>

                  {/* Top Right Badge */}
                  {video.remarks && (
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                          {video.remarks}
                      </div>
                  )}
                </div>
                
                <div className="mt-3 px-1">
                  <h3 className="font-bold text-sm text-text-primary truncate group-hover:text-primary transition-colors duration-300">{video.title}</h3>
                  <div className="flex items-center gap-2 mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-text-secondary font-medium">
                          {video.sourceType === 'm3u8' ? '直播' : '点播'}
                      </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};