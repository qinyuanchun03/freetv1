import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Source, Video, Player, HistoryEntry, Episode } from './types';
import { SourceManager } from './components/SourceManager';
import { VideoGrid } from './components/VideoGrid';
import { VideoPlayer } from './components/VideoPlayer';
import { HistoryGrid } from './components/HistoryGrid';
import { fetchVideos, setProxyUrl } from './services/cmsService';
import { SearchIcon } from './components/icons';

// 一个经过大幅扩充和精心策划的预定义源列表。
// 移除了重复项，并清理了名称以提供更好的用户体验。
const predefinedSourcesList: Array<{ name: string; url: string; type: 'apple-cms' | 'm3u8' }> = [
  { name: "CK资源网", url: "https://ckzy.me/api.php/provide/vod/", type: 'apple-cms' },
  { name: "LSP资源", url: "https://apilsbzy.com/api.php/provide/vod/", type: 'apple-cms' },
  { name: "TV-爱坤资源", url: "https://ikunzyapi.com/api.php/provide/vod", type: 'apple-cms' },
  { name: "电影天堂", url: "http://caiji.dyttzyapi.com/api.php/provide/vod", type: 'apple-cms' },
  { name: "暴风资源", url: "https://bfzyapi.com/api.php/provide/vod", type: 'apple-cms' },
  { name: "非凡影视(新)", url: "https://api.ffzyapi.com/api.php/provide/vod", type: 'apple-cms' },
  { name: "红牛资源", url: "https://www.hongniuzy3.com/api.php/provide/vod", type: 'apple-cms' },
  { name: "极速资源", url: "https://jszyapi.com/api.php/provide/vod", type: 'apple-cms' },
  { name: "快车资源", url: "https://caiji.kuaichezy.org/api.php/provide/vod", type: 'apple-cms' },
  { name: "量子资源", url: "https://cj.lziapi.com/api.php/provide/vod", type: 'apple-cms' },
  { name: "茅台资源", url: "https://caiji.maotaizy.cc/api.php/provide/vod", type: 'apple-cms' },
  { name: "魔都资源", url: "https://www.mdzyapi.com/api.php/provide/vod", type: 'apple-cms' },
  { name: "闪电资源", url: "https://xsd.sdzyapi.com/api.php/provide/vod", type: 'apple-cms' },
  { name: "天涯资源", url: "https://tyyszy.com/api.php/provide/vod", type: 'apple-cms' },
  { name: "卧龙资源", url: "https://wolongzyw.com/api.php/provide/vod", type: 'apple-cms' },
  { name: "无尽资源", url: "https://api.wujinapi.me/api.php/provide/vod", type: 'apple-cms' },
  { name: "新浪资源", url: "https://api.xinlangapi.com/xinlangapi.php/provide/vod", type: 'apple-cms' },
  { name: "最大资源", url: "https://api.zuidapi.com/api.php/provide/vod", type: 'apple-cms' }
];
predefinedSourcesList.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans'));

const defaultPlayers: Player[] = [
    { id: 'dplayer', name: '内置播放器', type: 'dplayer' },
    { id: 'ikun-parser', name: '爱坤解析', type: 'iframe', url: 'https://www.ikdmjx.com/?url=' },
    { id: 'playerjy-parser', name: 'PlayerJY 解析', type: 'iframe', url: 'https://jx.playerjy.com/?url=' },
];

const MAX_HISTORY_ITEMS = 50;

const App: React.FC = () => {
  const [sources, setSources] = useState<Source[]>(() => {
    const savedSources = localStorage.getItem('cms-player-sources');
    if (savedSources) {
      try {
        const parsed = JSON.parse(savedSources);
        return parsed.map((s: any) => ({ 
          ...s, 
          status: s.status || 'unknown',
          type: s.type || (s.url.toLowerCase().endsWith('.m3u8') ? 'm3u8' : 'apple-cms') 
        }));
      } catch (error) {
        console.error("从localStorage解析源失败，使用默认值。", error);
      }
    }
    return predefinedSourcesList.map(s => ({
      id: s.url,
      name: s.name,
      url: s.url,
      type: s.type,
      status: 'unknown'
    }));
  });
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentView, setCurrentView] = useState<'home' | 'search'>('home');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(() => {
      return localStorage.getItem('cms-player-selected-player') || 'dplayer';
  });
  const [corsProxyUrl, setCorsProxyUrl] = useState<string>(() => {
    return localStorage.getItem('cms-player-proxy-url') || 'https://cross.250221.xyz/?url=';
  });
  const [viewingHistory, setViewingHistory] = useState<HistoryEntry[]>(() => {
    const savedHistory = localStorage.getItem('cms-player-viewing-history');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });


  useEffect(() => {
    localStorage.setItem('cms-player-sources', JSON.stringify(sources));
  }, [sources]);
  
  useEffect(() => {
    localStorage.setItem('cms-player-selected-player', selectedPlayerId);
  }, [selectedPlayerId]);
  
  useEffect(() => {
    localStorage.setItem('cms-player-proxy-url', corsProxyUrl);
    setProxyUrl(corsProxyUrl);
  }, [corsProxyUrl]);
  
  useEffect(() => {
    localStorage.setItem('cms-player-viewing-history', JSON.stringify(viewingHistory));
  }, [viewingHistory]);

  const alternativeVideos = useMemo(() => {
    if (!selectedVideo) return [];
    return videos.filter(v => v.title === selectedVideo.title && v.sourceId !== selectedVideo.sourceId);
  }, [selectedVideo, videos]);

  const testSingleSource = async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'testing', latency: undefined } : s));
    
    const startTime = performance.now();
    try {
        await fetchVideos(source);
        const endTime = performance.now();
        const latency = Math.round(endTime - startTime);
        setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'available', latency } : s));
    } catch (e) {
        setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'unavailable', latency: undefined } : s));
    }
  };

  const testAllSources = async () => {
    setSources(prev => prev.map(s => ({ ...s, status: 'testing', latency: undefined })));

    const results = await Promise.all(
        sources.map(async source => {
            const startTime = performance.now();
            try {
                await fetchVideos(source);
                const endTime = performance.now();
                return { id: source.id, status: 'available' as const, latency: Math.round(endTime - startTime) };
            } catch (e) {
                return { id: source.id, status: 'unavailable' as const, latency: undefined };
            }
        })
    );
    
    const resultMap = new Map<string, { status: 'available' | 'unavailable'; latency: number | undefined }>(results.map(r => [r.id, { status: r.status, latency: r.latency }]));

    setSources(prev => prev.map(s => ({
        ...s,
        status: resultMap.get(s.id)?.status || s.status,
        latency: resultMap.get(s.id)?.latency
    })));
  };

  const handleSearch = useCallback(async (query: string, isBackgroundLoad = false) => {
    setCurrentView('search');
    setSearchQuery(query);
    setSelectedVideo(null);

    if (!isBackgroundLoad) {
        try {
            if (window.location.protocol.startsWith('http')) {
                const params = new URLSearchParams();
                if (query.trim()) {
                    params.set('q', query);
                }
                window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
            }
        } catch (e) {
            console.warn("无法更新URL。History API可能受到限制。", e);
        }
    }

    if (!query.trim()) {
      setVideos([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    
    const searchableSources = sources.filter(s => s.status === 'available' || s.status === 'unknown');
    if (searchableSources.length === 0) {
      setError("没有可用的源。请在设置中添加源或测试现有源。");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setVideos([]);
    
    const promises = searchableSources.map(source => fetchVideos(source, query.trim()));
    const results = await Promise.allSettled(promises);
    
    const successfulResults: Video[] = [];
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        successfulResults.push(...result.value);
      }
    });

    setVideos(successfulResults);
    
    const errorMessages = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason?.message || '某个源发生未知错误。');
      
    if (errorMessages.length > 0) {
      setError(`一个或多个源加载失败:\n\n- ${errorMessages.join('\n- ')}`);
    }
    
    setIsLoading(false);
  }, [sources]);
  
  const handleGoHome = () => {
    setSelectedVideo(null);
    setCurrentView('home');
    setSearchQuery('');
    setVideos([]);
    setError(null);
    try {
        if (window.location.protocol.startsWith('http')) {
            const params = new URLSearchParams(window.location.search);
            params.delete('q');
            params.delete('videoId');
            params.delete('sourceId');
            window.history.pushState({}, '', `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`);
        }
    } catch(e) {
        console.warn("无法更新URL。History API可能受到限制。", e);
    }
  };

  useEffect(() => {
    setProxyUrl(corsProxyUrl);
    
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('videoId');
    const sourceId = params.get('sourceId');
    const query = params.get('q');

    const restoreContent = async () => {
        if (query) await handleSearch(query, true);
    };

    if (videoId && sourceId) {
        const savedVideo = sessionStorage.getItem('cms-player-selected-video');
        if (savedVideo) {
            try {
                const parsedVideo = JSON.parse(savedVideo);
                if (String(parsedVideo.id) === videoId && parsedVideo.sourceId === sourceId) {
                    restoreContent().then(() => setSelectedVideo(parsedVideo));
                    return;
                }
            } catch (e) { console.error("解析已保存的视频失败", e) }
        }
    } 
    
    if (query) {
        handleSearch(query, false);
    } else {
        setCurrentView('home');
    }
  }, [corsProxyUrl, handleSearch]);

  const handleAddSource = (sourceToAdd: { name: string, url: string }) => {
    if (sources.some(s => s.url === sourceToAdd.url)) {
        alert("该源已存在。");
        return;
    }
    try {
        new URL(sourceToAdd.url);
        const newSource: Source = {
            id: new Date().toISOString(),
            name: sourceToAdd.name,
            url: sourceToAdd.url,
            type: sourceToAdd.url.toLowerCase().endsWith('.m3u8') ? 'm3u8' : 'apple-cms',
            status: 'unknown',
        };
        setSources(prev => [...prev, newSource]);
    } catch(e) {
        alert("无效的URL。");
    }
  };

  const handleDeleteSource = (id: string) => {
    const newSources = sources.filter(s => s.id !== id);
    setSources(newSources);
    setVideos(prev => prev.filter(v => v.sourceId !== id));
  };
  
  const handleSelectVideo = (video: Video) => {
    setSelectedVideo(video);
    sessionStorage.setItem('cms-player-selected-video', JSON.stringify(video));
    try {
        if (window.location.protocol.startsWith('http')) {
            const params = new URLSearchParams(window.location.search);
            params.set('videoId', String(video.id));
            params.set('sourceId', video.sourceId);
            window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
        }
    } catch (e) {
      console.warn("无法更新URL。History API可能受到限制。", e);
    }
    window.scrollTo(0, 0);
  };

  const handleBackToGrid = () => {
    setSelectedVideo(null);
    sessionStorage.removeItem('cms-player-selected-video');
    try {
        if (window.location.protocol.startsWith('http')) {
            const params = new URLSearchParams(window.location.search);
            params.delete('videoId');
            params.delete('sourceId');
            window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
        }
    } catch (e) {
        console.warn("无法更新URL。History API可能受到限制。", e);
    }
  };

  const handleEpisodePlay = useCallback((video: Video, episode: Episode) => {
    setViewingHistory(prevHistory => {
      const newEntry: HistoryEntry = {
        video: video,
        episodeName: episode.name,
        lastWatched: Date.now(),
      };

      const filteredHistory = prevHistory.filter(
        entry => !(entry.video.id === video.id && entry.video.sourceId === video.sourceId)
      );

      const updatedHistory = [newEntry, ...filteredHistory];
      return updatedHistory.slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('您确定要清空所有观看记录吗？此操作无法撤销。')) {
      setViewingHistory([]);
    }
  };

  const groupedVideos = useMemo(() => {
    return videos.reduce((acc, video) => {
      const sourceName = video.sourceName;
      if (!acc[sourceName]) {
        acc[sourceName] = [];
      }
      acc[sourceName].push(video);
      return acc;
    }, {} as Record<string, Video[]>);
  }, [videos]);

  const selectedPlayer = useMemo(() => {
    return defaultPlayers.find(p => p.id === selectedPlayerId) || defaultPlayers[0];
  }, [selectedPlayerId]);
  
  const relatedVideos = useMemo(() => {
    if (!selectedVideo) return [];
    return videos.filter(v => v.title === selectedVideo.title && v.id !== selectedVideo.id);
  }, [selectedVideo, videos]);


  const renderHomeAndSearch = () => {
    if (currentView === 'home') {
       return (
         <div className="p-4 sm:p-6 lg:p-8">
           <HistoryGrid history={viewingHistory} onSelectVideo={handleSelectVideo} onClearHistory={handleClearHistory} />
           {viewingHistory.length === 0 && (
             <div className="flex flex-col items-center justify-center h-64 text-center text-text-secondary p-4 bg-surface rounded-lg">
                <SearchIcon className="w-24 h-24 mb-4 text-secondary" />
                <h2 className="text-2xl font-bold">欢迎使用 CMS 播放器</h2>
                <p className="mt-2 max-w-md">您的观看记录会显示在这里。请使用上方的搜索框开始查找视频。</p>
             </div>
           )}
         </div>
       );
    }

    if (currentView === 'search') {
      const SearchContent = () => {
        if (isLoading) {
          return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;
        }
        if (error) {
          return <div className="flex flex-col items-center justify-center h-auto my-8 text-center text-red-500 p-4 bg-red-50 rounded-lg">
              <h2 className="text-xl font-semibold">加载出错</h2>
              <pre className="text-left text-sm whitespace-pre-wrap mt-2 font-sans">{error}</pre>
              </div>;
        }
        if (videos.length > 0) {
            return <VideoGrid groupedVideos={groupedVideos} onSelectVideo={handleSelectVideo} />;
        }
        if (!isLoading) {
            const message = searchQuery 
            ? `"${searchQuery}" 没有返回任何结果。`
            : "开始在上方搜索框中输入内容以查找视频。";
          const title = searchQuery ? "未找到结果" : "搜索视频";
           return (
            <div className="flex flex-col items-center justify-center h-64 text-center text-text-secondary p-4 bg-surface rounded-lg">
                <SearchIcon className="w-24 h-24 mb-4 text-secondary" />
                <h2 className="text-xl font-semibold">{title}</h2>
                <p>{message}</p>
            </div>
           );
        }
        return null;
      };
      return <div className="p-4 sm:p-6 lg:p-8"><SearchContent /></div>;
    }
    
    return null;
  }

  return (
    <div className="min-h-screen font-sans">
      {selectedVideo ? (
        <VideoPlayer 
          key={`${selectedVideo.sourceId}-${selectedVideo.id}`}
          video={selectedVideo} 
          player={selectedPlayer}
          onBack={handleBackToGrid}
          relatedVideos={relatedVideos}
          alternativeVideos={alternativeVideos}
          onSelectVideo={handleSelectVideo}
          onEpisodePlay={handleEpisodePlay}
        />
      ) : (
        <>
          <SourceManager 
            sources={sources}
            players={defaultPlayers}
            selectedPlayerId={selectedPlayerId}
            predefinedSources={predefinedSourcesList}
            corsProxyUrl={corsProxyUrl}
            onAddSource={handleAddSource}
            onDeleteSource={handleDeleteSource}
            onSearch={handleSearch}
            onPlayerChange={setSelectedPlayerId}
            onTestSource={testSingleSource}
            onTestAllSources={testAllSources}
            onCorsProxyUrlChange={setCorsProxyUrl}
            onGoHome={handleGoHome}
          />
          <main>
            <div className="animate-fadeInPage">
              {renderHomeAndSearch()}
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default App;