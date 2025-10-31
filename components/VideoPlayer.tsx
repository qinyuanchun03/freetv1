import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Video, Episode, Player } from '../types';
import { BackIcon, SortIcon } from './icons';

declare var DPlayer: any;

interface VideoPlayerProps {
  video: Video;
  player: Player;
  relatedVideos: Video[];
  alternativeVideos: Video[];
  onBack: () => void;
  onSelectVideo: (video: Video) => void;
  onEpisodePlay: (video: Video, episode: Episode) => void;
}

const EPISODE_GROUP_SIZE = 25;

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, player, relatedVideos, alternativeVideos, onBack, onSelectVideo, onEpisodePlay }) => {
  const dplayerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [activeTab, setActiveTab] = useState<'episodes' | 'sources'>('episodes');
  const [isReversed, setIsReversed] = useState(false);
  const [episodeGroupIndex, setEpisodeGroupIndex] = useState(0);

  useEffect(() => {
    if (video.episodes && video.episodes.length > 0) {
      setCurrentEpisode(video.episodes[0]);
    } else {
      setCurrentEpisode(null);
    }
    setActiveTab('episodes');
    setEpisodeGroupIndex(0);
    setIsReversed(false);
  }, [video]);

  useEffect(() => {
    if (currentEpisode) {
      onEpisodePlay(video, currentEpisode);
    }
  }, [currentEpisode, video, onEpisodePlay]);

  useEffect(() => {
    if (dplayerRef.current) {
      dplayerRef.current.destroy();
      dplayerRef.current = null;
    }
    
    if (currentEpisode && playerContainerRef.current) {
      if (player.type === 'dplayer') {
        const isM3U8 = video.sourceType === 'm3u8' || currentEpisode.url.includes('.m3u8');
        const dplayerOptions = {
          container: playerContainerRef.current,
          video: { url: currentEpisode.url, type: isM3U8 ? 'hls' : 'auto' },
          autoplay: true,
        };
        dplayerRef.current = new DPlayer(dplayerOptions);
      }
    }

    return () => {
      if (dplayerRef.current) {
        dplayerRef.current.destroy();
        dplayerRef.current = null;
      }
    };
  }, [currentEpisode, player, video.sourceType]);

  const episodeGroups = useMemo(() => {
    if (!video.episodes || video.episodes.length === 0) return [];
    
    const sortedEpisodes = [...video.episodes];
    if (isReversed) {
      sortedEpisodes.reverse();
    }
    
    const groups = [];
    for (let i = 0; i < sortedEpisodes.length; i += EPISODE_GROUP_SIZE) {
      groups.push(sortedEpisodes.slice(i, i + EPISODE_GROUP_SIZE));
    }
    return groups;
  }, [video.episodes, isReversed]);

  const allSourcesForCurrentVideo = useMemo(() => {
    const sourceMap = new Map<string, Video>();
    [video, ...alternativeVideos].forEach(v => {
      if (!sourceMap.has(v.sourceId)) {
        sourceMap.set(v.sourceId, v);
      }
    });
    return Array.from(sourceMap.values()).sort((a, b) => a.sourceName.localeCompare(b.sourceName, 'zh-Hans'));
  }, [video, alternativeVideos]);


  return (
    <div className="animate-fadeInPage">
      <header className="bg-surface/95 backdrop-blur-sm shadow-sm sticky top-0 z-30">
        <div className="p-4 flex items-center gap-4 max-w-screen-2xl mx-auto">
          <button onClick={onBack} className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
            <BackIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center text-sm text-text-secondary truncate">
            <h1 className="font-semibold text-text-primary text-base truncate">{video.title}</h1>
            {currentEpisode && (
              <>
                <span className="mx-2 text-gray-300">/</span>
                <span className="truncate">{currentEpisode.name}</span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="w-full lg:flex-1">
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              {player.type === 'dplayer' && <div ref={playerContainerRef} className="w-full h-full" />}
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
            </div>
          </div>

          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="bg-surface/95 rounded-2xl shadow-2xl h-full flex flex-col">
              <div className="flex border-b border-border-color" role="tablist">
                <button
                  onClick={() => setActiveTab('episodes')}
                  role="tab"
                  aria-selected={activeTab === 'episodes'}
                  className={`flex-1 py-3 text-sm font-semibold text-center transition-colors focus:outline-none ${activeTab === 'episodes' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:bg-background'}`}
                >
                  选集
                </button>
                <button
                  onClick={() => setActiveTab('sources')}
                  role="tab"
                  aria-selected={activeTab === 'sources'}
                  className={`flex-1 py-3 text-sm font-semibold text-center transition-colors focus:outline-none ${activeTab === 'sources' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:bg-background'}`}
                >
                  换源 ({allSourcesForCurrentVideo.length})
                </button>
              </div>

              <div className="flex-grow overflow-y-auto max-h-[60vh] lg:max-h-none">
                {activeTab === 'episodes' && (
                  <div role="tabpanel" className="animate-fadeInPage">
                    {episodeGroups.length > 0 ? (
                      <>
                        <div className="p-2 border-b border-border-color flex items-center justify-between flex-wrap gap-y-2">
                            <div className="flex items-center flex-wrap gap-2">
                            {episodeGroups.length > 1 && episodeGroups.map((_, index) => {
                                const start = index * EPISODE_GROUP_SIZE + 1;
                                const end = start + episodeGroups[index].length - 1;
                                return (
                                <button key={index} onClick={() => setEpisodeGroupIndex(index)} className={`px-2 py-1 text-xs font-semibold rounded ${episodeGroupIndex === index ? 'bg-primary text-white' : 'bg-background hover:bg-border-color'}`}>
                                    {`${start}-${end}`}
                                </button>
                                );
                            })}
                            </div>
                            <button onClick={() => setIsReversed(prev => !prev)} className="p-1 text-text-secondary hover:text-primary rounded-full hover:bg-background transition-colors" title={isReversed ? "降序" : "升序"}>
                              <SortIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] gap-2">
                            {episodeGroups[episodeGroupIndex]?.map(episode => (
                                <button key={`${video.id}-${episode.name}`} onClick={() => setCurrentEpisode(episode)} className={`p-2 text-sm font-medium rounded-md transition-all duration-200 aspect-square flex items-center justify-center truncate hover:scale-110 ${currentEpisode?.url === episode.url ? 'bg-primary text-white scale-110' : 'bg-background hover:bg-border-color text-text-primary'}`}>
                                {episode.name}
                                </button>
                            ))}
                            </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-text-secondary text-sm text-center py-8">暂无剧集信息。</p>
                    )}
                  </div>
                )}
                {activeTab === 'sources' && (
                  <div role="tabpanel" className="animate-fadeInPage p-4">
                    <ul className="space-y-2">
                      {allSourcesForCurrentVideo.map((sourceVideo) => (
                        <li key={sourceVideo.sourceId}>
                          <button onClick={() => onSelectVideo(sourceVideo)} disabled={sourceVideo.sourceId === video.sourceId} className={`w-full text-left px-4 py-3 rounded-md transition-colors ${sourceVideo.sourceId === video.sourceId ? 'bg-primary text-white cursor-default' : 'bg-background hover:bg-border-color text-text-primary'}`}>
                            <span className="font-semibold">{sourceVideo.sourceName}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 lg:mt-12 bg-surface/95 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-48 lg:w-56 flex-shrink-0">
            <img src={video.thumbnailUrl} alt={video.title} className="w-full aspect-[2/3] object-cover rounded-xl" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-text-primary">{video.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3">
              {video.remarks && (
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                  {video.remarks}
                </span>
              )}
              <span className="bg-secondary/10 text-text-secondary text-xs font-bold px-2 py-1 rounded">
                {video.sourceName}
              </span>
            </div>
            <p className="mt-4 text-text-secondary leading-relaxed">{video.description}</p>
          </div>
        </div>

        {relatedVideos.length > 0 && (
          <div className="mt-8 lg:mt-12">
            <h2 className="text-2xl font-bold text-text-primary mb-4">相关推荐</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {relatedVideos.map((relatedVideo) => (
                <div key={`${relatedVideo.sourceId}-${relatedVideo.id}`} onClick={() => onSelectVideo(relatedVideo)} className="group cursor-pointer transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.03]">
                  <div className="relative aspect-[2/3] bg-surface rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                    <img src={relatedVideo.thumbnailUrl} alt={relatedVideo.title} className="w-full h-full object-cover" loading="lazy" />
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
      </main>
    </div>
  );
};