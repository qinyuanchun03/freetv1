import React from 'react';
import type { Video } from '../types';

interface VideoGridProps {
  groupedVideos: Record<string, Video[]>;
  onSelectVideo: (video: Video) => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({ groupedVideos, onSelectVideo }) => {
  const sources = Object.keys(groupedVideos);

  return (
    <div className="space-y-10">
      {sources.map(sourceName => (
        <section key={sourceName}>
          <h2 className="text-2xl font-bold text-text-primary mb-4 border-b-2 border-primary pb-2">{sourceName}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {groupedVideos[sourceName].map((video) => (
              <div
                key={`${video.sourceId}-${video.id}`}
                onClick={() => onSelectVideo(video)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[2/3] bg-surface rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                     {/* Overlay content if needed */}
                  </div>
                  {video.remarks && (
                      <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-md">
                          {video.remarks}
                      </div>
                  )}
                </div>
                <div className="pt-2">
                  <h3 className="font-semibold text-sm truncate text-text-primary">{video.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};