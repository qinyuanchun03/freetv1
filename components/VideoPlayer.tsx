import React, { useEffect, useRef, useState } from 'react';
import type { Video, Episode, Player } from '../types';
import { BackIcon } from './icons';

declare var DPlayer: any;

interface VideoPlayerProps {
  video: Video;
  player: Player;
  relatedVideos: Video[];
  alternativeVideos: Video[];
  onBack: () => void;
  onSelectVideo: (video: Video) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, player, relatedVideos, alternativeVideos, onBack, onSelectVideo }) => {
  const dplayerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [activeTab, setActiveTab] = useState<'episodes' | 'sources'>('episodes');
  // 重构：从存储索引改为存储剧集名称，这更加健壮。
  const targetEpisodeNameRef = useRef<string | null>(null);

  useEffect(() => {
    // 优先处理来自源切换的特定剧集请求
    if (targetEpisodeNameRef.current) {
        // 在新视频的剧集列表中按名称查找
        const targetEpisode = video.episodes.find(ep => ep.name === targetEpisodeNameRef.current);
        targetEpisodeNameRef.current = null; // 使用后立即重置
        if (targetEpisode) {
            setCurrentEpisode(targetEpisode);
            return; // 找到目标，提前退出
        }
    }

    // 默认行为：如果没有特定目标或找不到目标，则播放第一个剧集
    if (video.episodes && video.episodes.length > 0) {
      setCurrentEpisode(video.episodes[0]);
    } else {
      setCurrentEpisode(null);
    }
    // 每当主视频更换时，总是切回剧集标签页
    setActiveTab('episodes');
  }, [video]);

  useEffect(() => {
    if (dplayerRef.current) {
      dplayerRef.current.destroy();
      dplayerRef.current = null;
    }
    
    if (player.type === 'dplayer' && currentEpisode && containerRef.current) {
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

    return () => {
      if (dplayerRef.current) {
        dplayerRef.current.destroy();
        dplayerRef.current = null;
      }
    };
  }, [currentEpisode, player, video.sourceType]);

  const allSourcesForCurrentVideo = [video, ...alternativeVideos].sort((a,b) => a.sourceName.localeCompare(b.sourceName));

  const handleSourceSwitch = (newSourceVideo: Video) => {
      // 记住当前播放剧集的 *名称*，而不是它的位置。
      const currentEpisodeName = currentEpisode?.name;
      if (currentEpisodeName) {
        targetEpisodeNameRef.current = currentEpisodeName;
      }
      
      // 触发视频选择流程以切换到新源。
      // 后续的useEffect将使用ref中存储的名称来设置正确的剧集。
      onSelectVideo(newSourceVideo);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors font-medium"
        >
          <BackIcon className="w-5 h-5" />
          <span>返回列表</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left Column: Player */}
        <div className="w-full lg:w-2/3 xl:w-3/4 flex-shrink-0">
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
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
        </div>

        {/* Right Column: Details, Episodes, Sources */}
        <div className="w-full lg:w-1/3 xl:w-1/4">
          <div className="bg-surface rounded-lg shadow-lg h-full flex flex-col">
              <div className="p-4 border-b border-border-color">
                <h1 className="text-2xl font-bold text-text-primary leading-tight">{video.title}</h1>
                <p className="mt-2 text-sm text-text-secondary line-clamp-3">{video.description}</p>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border-color" role="tablist">
                  <button
                      onClick={() => setActiveTab('episodes')}
                      role="tab"
                      aria-selected={activeTab === 'episodes'}
                      className={`flex-1 py-3 text-sm font-semibold text-center transition-colors focus:outline-none ${
                          activeTab === 'episodes'
                              ? 'text-primary border-b-2 border-primary'
                              : 'text-text-secondary hover:bg-background'
                      }`}
                  >
                      剧集
                  </button>
                  <button
                      onClick={() => setActiveTab('sources')}
                      role="tab"
                      aria-selected={activeTab === 'sources'}
                      className={`flex-1 py-3 text-sm font-semibold text-center transition-colors focus:outline-none ${
                          activeTab === 'sources'
                              ? 'text-primary border-b-2 border-primary'
                              : 'text-text-secondary hover:bg-background'
                      }`}
                  >
                      播放源 ({allSourcesForCurrentVideo.length})
                  </button>
              </div>

              {/* Tab Panels */}
              <div className="flex-grow overflow-y-auto p-4">
                  {/* Episodes Panel */}
                  <div role="tabpanel" hidden={activeTab !== 'episodes'}>
                      {video.episodes && video.episodes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                              {video.episodes.map((episode) => (
                                  <button
                                      key={`${video.id}-${episode.name}`}
                                      onClick={() => setCurrentEpisode(episode)}
                                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors w-full sm:w-auto text-left ${
                                          currentEpisode?.url === episode.url
                                              ? 'bg-primary text-white'
                                              : 'bg-background hover:bg-border-color'
                                      }`}
                                  >
                                      {episode.name}
                                  </button>
                              ))}
                          </div>
                      ) : (
                          <p className="text-text-secondary text-sm text-center py-4">暂无剧集信息。</p>
                      )}
                  </div>
                  
                  {/* Sources Panel */}
                  <div role="tabpanel" hidden={activeTab !== 'sources'}>
                      <ul className="space-y-2">
                          {allSourcesForCurrentVideo.map((sourceVideo) => (
                              <li key={sourceVideo.sourceId}>
                                  <button
                                      onClick={() => handleSourceSwitch(sourceVideo)}
                                      disabled={sourceVideo.sourceId === video.sourceId}
                                      className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                                          sourceVideo.sourceId === video.sourceId
                                              ? 'bg-primary text-white cursor-default'
                                              : 'bg-background hover:bg-border-color text-text-primary'
                                      }`}
                                  >
                                      <span className="font-semibold">{sourceVideo.sourceName}</span>
                                  </button>
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>
          </div>
        </div>
      </div>
      
      {/* Related Videos Section */}
      {relatedVideos.length > 0 && (
          <div className="mt-8 lg:mt-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">相关推荐</h2>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {relatedVideos.map((relatedVideo) => (
                        <div
                        key={`${relatedVideo.sourceId}-${relatedVideo.id}`}
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
  );
};
