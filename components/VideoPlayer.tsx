import React, { useEffect, useRef, useState } from 'react';
import type { Video, Episode, Player } from '../types';
import { BackIcon } from './icons';

declare var DPlayer: any;

interface VideoPlayerProps {
  video: Video;
  player: Player;
  relatedVideos: Video[];
  onBack: () => void;
  onSelectVideo: (video: Video) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, player, relatedVideos, onBack, onSelectVideo }) => {
  const dplayerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);

  useEffect(() => {
    if (video.episodes && video.episodes.length > 0) {
      setCurrentEpisode(video.episodes[0]);
    } else {
      setCurrentEpisode(null);
    }
  }, [video]);

  useEffect(() => {
    // Always destroy the previous DPlayer instance when dependencies change
    if (dplayerRef.current) {
      dplayerRef.current.destroy();
      dplayerRef.current = null;
    }
    
    // Initialize a new player if it's DPlayer type and conditions are met
    if (player.type === 'dplayer' && currentEpisode && containerRef.current) {
      // For M3U8 sources or URLs ending with .m3u8, use HLS.
      const isM3U8 = video.sourceType === 'm3u8' || currentEpisode.url.includes('.m3u8');
      
      dplayerRef.current = new DPlayer({
        container: containerRef.current,
        video: {
          url: currentEpisode.url,
          type: isM3U8 ? 'hls' : 'auto',
        },
        autoplay: true,
      });
    }

    // Return a cleanup function that will be called on unmount or before the effect runs again
    return () => {
      if (dplayerRef.current) {
        dplayerRef.current.destroy();
        dplayerRef.current = null;
      }
    };
  }, [currentEpisode, player, video]); // Re-create player when episode, player, or video changes


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors font-medium"
        >
          <BackIcon className="w-5 h-5" />
          <span>返回列表</span>
        </button>
      </div>
      
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl mb-6">
        {player.type === 'dplayer' && <div ref={containerRef} className="w-full h-full" />}
        {player.type === 'iframe' && currentEpisode && player.url && (
            <iframe
                src={`${player.url}${encodeURIComponent(currentEpisode.url)}`}
                className="w-full h-full"
                frameBorder="0"
                scrolling="no"
                allowFullScreen={true}
                title={currentEpisode.name}
            />
        )}
         {(player.type === 'iframe' && (!currentEpisode || !player.url)) && (
             <div className="w-full h-full flex items-center justify-center text-white">
                <p>无法加载视频。</p>
            </div>
        )}
      </div>
      
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary">{video.title}</h1>
          <p className="mt-2 text-text-secondary">{video.description}</p>
        </div>

        {video.episodes && video.episodes.length > 0 && (
          <div>
              <h2 className="text-xl font-bold text-text-primary mb-4">剧集</h2>
              <div className="flex flex-wrap gap-2">
                  {video.episodes.map((episode) => (
                      <button
                          key={episode.name}
                          onClick={() => setCurrentEpisode(episode)}
                          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                              currentEpisode?.url === episode.url
                                  ? 'bg-primary text-white'
                                  : 'bg-surface hover:bg-gray-200'
                          }`}
                      >
                          {episode.name}
                      </button>
                  ))}
              </div>
          </div>
        )}

        {relatedVideos.length > 0 && (
          <div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">相关推荐</h2>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {relatedVideos.map((relatedVideo) => (
                        <div
                        key={relatedVideo.id}
                        onClick={() => onSelectVideo(relatedVideo)}
                        className="group cursor-pointer"
                        >
                            <div className="relative aspect-[2/3] bg-surface rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                                <img
                                src={relatedVideo.thumbnailUrl}
                                alt={relatedVideo.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                />
                                {relatedVideo.remarks && (
                                    <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-md">
                                        {relatedVideo.remarks}
                                    </div>
                                )}
                            </div>
                            <div className="pt-2">
                                <h3 className="font-semibold text-sm truncate text-text-primary">{relatedVideo.title}</h3>
                            </div>
                        </div>
                    ))}
                </div>
          </div>
        )}
      </div>
    </div>
  );
};