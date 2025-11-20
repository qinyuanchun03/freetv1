import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Video, Episode, Player } from '../types';
import { BackIcon, SortIcon, ServerStackIcon, PlayIcon } from './icons';

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

const EPISODE_GROUP_SIZE = 50;

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
          theme: '#22c55e',
          lang: 'zh-cn',
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
    <div className="animate-fadeInPage pb-12">
      <header className="bg-surface/90 backdrop-blur-md shadow-sm sticky top-0 z-30 border-b border-border-color">
        <div className="p-3 flex items-center gap-4 max-w-screen-2xl mx-auto">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-background text-text-secondary hover:text-text-primary transition-colors">
            <BackIcon className="w-6 h-6" />
          </button>
          <div className="flex flex-col min-w-0">
            <h1 className="font-bold text-text-primary text-lg truncate">{video.title}</h1>
            {currentEpisode && (
               <p className="text-xs text-text-secondary truncate">正在播放: {currentEpisode.name}</p>
            )}
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6 max-w-screen-2xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Player Column */}
          <div className="w-full lg:flex-1 min-w-0">
            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 relative group">
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

            {/* Video Info & Actions */}
            <div className="mt-6 bg-surface rounded-2xl p-6 shadow-sm border border-border-color">
                <div className="flex flex-col md:flex-row gap-6">
                   <div className="hidden md:block w-32 flex-shrink-0">
                      <img src={video.thumbnailUrl} className="w-full rounded-lg shadow-md object-cover aspect-[2/3]" alt="poster" />
                   </div>
                   <div className="flex-1">
                      <h1 className="text-2xl font-bold text-text-primary mb-2">{video.title}</h1>
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="bg-primary text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm shadow-primary/30">
                            {video.sourceName}
                        </span>
                         {video.remarks && (
                            <span className="bg-gray-100 text-text-secondary text-xs font-bold px-2.5 py-1 rounded-md border border-gray-200">
                            {video.remarks}
                            </span>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm leading-relaxed line-clamp-3 hover:line-clamp-none transition-all">
                          {video.description.replace(/<[^>]*>/g, '')}
                      </p>
                   </div>
                </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="w-full lg:w-[22rem] xl:w-96 flex-shrink-0 flex flex-col gap-4">
            <div className="bg-surface rounded-2xl shadow-lg border border-border-color flex flex-col h-[600px] lg:h-[calc(100vh-8rem)] sticky top-24 overflow-hidden">
              <div className="flex p-1 m-2 bg-background rounded-xl" role="tablist">
                <button
                  onClick={() => setActiveTab('episodes')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'episodes' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <PlayIcon className="w-4 h-4" />
                  选集
                </button>
                <button
                  onClick={() => setActiveTab('sources')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === 'sources' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                >
                  <ServerStackIcon className="w-4 h-4" />
                  换源 <span className="bg-primary/10 text-primary px-1.5 rounded-full text-[10px]">{allSourcesForCurrentVideo.length}</span>
                </button>
              </div>

              <div className="flex-grow overflow-y-auto min-h-0">
                {activeTab === 'episodes' && (
                  <div className="flex flex-col h-full animate-fadeIn">
                    {episodeGroups.length > 0 ? (
                      <>
                        <div className="px-4 py-2 flex items-center justify-between border-b border-border-color bg-surface sticky top-0 z-10">
                            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar max-w-[80%]">
                            {episodeGroups.length > 1 && episodeGroups.map((_, index) => {
                                const start = index * EPISODE_GROUP_SIZE + 1;
                                const end = start + episodeGroups[index].length - 1;
                                return (
                                <button 
                                    key={index} 
                                    onClick={() => setEpisodeGroupIndex(index)} 
                                    className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap transition-colors ${episodeGroupIndex === index ? 'bg-primary text-white' : 'bg-background text-text-secondary hover:bg-gray-200'}`}
                                >
                                    {start}-{end}
                                </button>
                                );
                            })}
                            </div>
                            <button onClick={() => setIsReversed(prev => !prev)} className="p-1.5 text-text-secondary hover:text-primary rounded-lg hover:bg-background transition-colors" title={isReversed ? "降序" : "升序"}>
                              <SortIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-3 grid grid-cols-4 gap-2 content-start">
                            {episodeGroups[episodeGroupIndex]?.map(episode => (
                                <button 
                                    key={`${video.id}-${episode.name}`} 
                                    onClick={() => setCurrentEpisode(episode)} 
                                    className={`
                                        relative py-2 px-1 text-xs font-semibold rounded-lg transition-all duration-200 border truncate
                                        ${currentEpisode?.url === episode.url 
                                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105 z-10' 
                                            : 'bg-background text-text-primary border-transparent hover:bg-white hover:border-border-color hover:shadow-sm'
                                        }
                                    `}
                                    title={episode.name}
                                >
                                {episode.name}
                                {currentEpisode?.url === episode.url && (
                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                                    </span>
                                )}
                                </button>
                            ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-text-secondary p-8">
                          <p>暂无剧集信息</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'sources' && (
                  <div className="p-3 space-y-2 animate-fadeIn">
                    {allSourcesForCurrentVideo.map((sourceVideo) => (
                      <button 
                        key={sourceVideo.sourceId}
                        onClick={() => onSelectVideo(sourceVideo)} 
                        disabled={sourceVideo.sourceId === video.sourceId} 
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group ${
                            sourceVideo.sourceId === video.sourceId 
                            ? 'bg-primary/5 border border-primary/30 ring-1 ring-primary/30 cursor-default' 
                            : 'bg-background border border-transparent hover:bg-white hover:border-border-color hover:shadow-md'
                        }`}
                      >
                        <div>
                            <span className={`font-bold block ${sourceVideo.sourceId === video.sourceId ? 'text-primary' : 'text-text-primary'}`}>
                                {sourceVideo.sourceName}
                            </span>
                            <span className="text-xs text-text-secondary opacity-70">
                                {sourceVideo.sourceType.toUpperCase()}
                            </span>
                        </div>
                        {sourceVideo.sourceId === video.sourceId && (
                             <div className="text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded">当前</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related Videos Section */}
        {relatedVideos.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border-color">
            <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                相关推荐
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedVideos.map((relatedVideo) => (
                <div key={`${relatedVideo.sourceId}-${relatedVideo.id}`} onClick={() => onSelectVideo(relatedVideo)} className="group cursor-pointer">
                  <div className="relative aspect-[3/4] bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <img src={relatedVideo.thumbnailUrl} alt={relatedVideo.title} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {relatedVideo.remarks && (
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {relatedVideo.remarks}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-sm truncate text-text-primary mt-2 group-hover:text-primary transition-colors">{relatedVideo.title}</h3>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};