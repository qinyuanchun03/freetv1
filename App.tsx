import React, { useState, useEffect } from 'react';
import type { Source, Video, Player, Proxy } from './types';
import { SourceManager } from './components/SourceManager';
import { VideoGrid } from './components/VideoGrid';
import { VideoPlayer } from './components/VideoPlayer';
import { fetchVideos } from './services/cmsService';
import { TvIcon, HomeIcon, FilmIcon, SparklesIcon, CubeIcon, SearchIcon } from './components/icons';

// FIX: The sort method was incorrectly widening the array type. By separating the array
// declaration from the in-place sort, we ensure TypeScript maintains the correct narrow type.
const predefinedSourcesList: Array<{ name: string; url: string; type: 'apple-cms' | 'm3u8' }> = [
  { name: "TV-爱坤资源", url: "https://ikunzyapi.com/api.php/provide/vod", type: 'apple-cms' },
  { name: "茅台资源", url: "https://caiji.maotaizy.cc/api.php/provide/vod/from/mtm3u8/at/josn/", type: 'apple-cms' },
  { name: "电影天堂", url: "https://caiji.dyttzyapi.com/api.php/provide/vod", type: 'apple-cms' },
];
predefinedSourcesList.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans'));


const categoryMap: Record<string, string | null> = {
  '首页': null,
  '电影': '1',
  '剧集': '2',
  '综艺': '3',
  '动漫': '4',
};

const defaultPlayers: Player[] = [
    { id: 'dplayer', name: 'DPlayer (默认)', type: 'dplayer' },
    { id: 'ikun-parser', name: '爱坤解析', type: 'iframe', url: 'https://www.ikdmjx.com/?url=' },
    { id: 'xj-player', name: 'XJPlayer (测试)', type: 'iframe', url: 'https://update.xiaojizy.live/aplayer/player.html?autoplay=1&movurl=' },
];

const defaultProxies: Proxy[] = [
    { id: 'netlify', name: 'Netlify 代理 (推荐)', url: '/api/proxy/' },
    { id: 'cors-eu-org', name: 'cors.eu.org (推荐)', url: 'https://cors.eu.org/' },
    { id: 'corsproxy-io', name: 'corsproxy.io', url: 'https://corsproxy.io/?' },
    { id: 'none', name: '不使用代理 (若直连失败)', url: '' },
    { id: 'custom', name: '自定义代理', url: '' },
];


const BottomNavBar: React.FC<{
    activeCategory: string;
    onSelectCategory: (category: string) => void;
}> = ({ activeCategory, onSelectCategory }) => {
    const navItems = [
        { icon: HomeIcon, label: '首页' },
        { icon: FilmIcon, label: '电影' },
        { icon: TvIcon, label: '剧集' },
        { icon: SparklesIcon, label: '动漫' },
        { icon: CubeIcon, label: '综艺' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-surface shadow-[0_-2px_10px_rgba(0,0,0,0.05)] flex justify-around items-center h-16 md:hidden z-40">
            {navItems.map((item) => (
                <button 
                    key={item.label}
                    onClick={() => onSelectCategory(item.label)}
                    className={`flex flex-col items-center justify-center space-y-1 w-full h-full transition-colors ${activeCategory === item.label ? 'text-primary' : 'text-text-secondary'}`}
                >
                    <item.icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{item.label}</span>
                </button>
            ))}
        </nav>
    );
};

const App: React.FC = () => {
  const [sources, setSources] = useState<Source[]>(() => {
    const savedSources = localStorage.getItem('cms-player-sources');
    if (savedSources) {
      try {
        const parsed = JSON.parse(savedSources);
        return parsed.map((s: any) => ({ 
          ...s, 
          status: s.status || 'unknown',
          // Backwards compatibility for old sources without a type
          type: s.type || (s.url.toLowerCase().endsWith('.m3u8') ? 'm3u8' : 'apple-cms') 
        }));
      } catch (error) {
        console.error("Failed to parse sources from localStorage, using default.", error);
        // If parsing fails, fall back to default sources.
      }
    }
    // On first load or if localStorage is corrupt, add ALL predefined sources
    return predefinedSourcesList.map(s => ({
      id: s.url, // Use URL as a unique ID for initial load
      name: s.name,
      url: s.url,
      type: s.type,
      status: 'unknown'
    }));
  });
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('首页');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(() => {
      return localStorage.getItem('cms-player-selected-player') || 'dplayer';
  });
  const [selectedProxyId, setSelectedProxyId] = useState<string>(() => {
    const savedProxy = localStorage.getItem('cms-player-selected-proxy');
    // Default to a working proxy for a better first-time experience.
    return savedProxy || 'cors-eu-org';
  });
  const [customProxyUrl, setCustomProxyUrl] = useState<string>(() => {
      return localStorage.getItem('cms-player-custom-proxy-url') || '';
  });

  const getSelectedProxy = () => {
    const proxy = defaultProxies.find(p => p.id === selectedProxyId);
    if (proxy?.id === 'custom') {
        return { ...proxy, url: customProxyUrl.trim() };
    }
    return proxy || defaultProxies.find(p => p.id === 'none');
  };
  const selectedProxy = getSelectedProxy();


  useEffect(() => {
    localStorage.setItem('cms-player-sources', JSON.stringify(sources));
  }, [sources]);
  
  useEffect(() => {
    localStorage.setItem('cms-player-selected-player', selectedPlayerId);
  }, [selectedPlayerId]);
  
  useEffect(() => {
    localStorage.setItem('cms-player-selected-proxy', selectedProxyId);
  }, [selectedProxyId]);
  
  useEffect(() => {
    localStorage.setItem('cms-player-custom-proxy-url', customProxyUrl);
  }, [customProxyUrl]);


  useEffect(() => {
    handleCategorySelect('首页');
  }, []);

  const testSingleSource = async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source) return;

    setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'testing' } : s));
    
    try {
        await fetchVideos(source, selectedProxy.url);
        setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'available' } : s));
    } catch (e) {
        setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'unavailable' } : s));
    }
  };

  const testAllSources = async () => {
    setSources(prev => prev.map(s => ({ ...s, status: 'testing' })));

    const results = await Promise.all(
        sources.map(async source => {
            try {
                await fetchVideos(source, selectedProxy.url);
                return { id: source.id, status: 'available' as const };
            } catch (e) {
                return { id: source.id, status: 'unavailable' as const };
            }
        })
    );
    
    const statusMap = new Map(results.map(r => [r.id, r.status]));

    setSources(prev => prev.map(s => ({
        ...s,
        status: statusMap.get(s.id) || s.status
    })));
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setActiveCategory(''); // Clear category selection when searching
    setSelectedVideo(null);

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
    
    const promises = searchableSources.map(source => fetchVideos(source, selectedProxy.url, query.trim()));
    const results = await Promise.allSettled(promises);
    
    const successfulResults: Video[] = [];
    const errorMessages: string[] = [];

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        successfulResults.push(...result.value);
      } else if (result.status === 'rejected') {
        errorMessages.push(result.reason?.message || '某个源发生未知错误。');
      }
    });

    setVideos(successfulResults);
    if (errorMessages.length > 0) {
      setError(`一个或多个源加载失败:\n\n- ${errorMessages.join('\n- ')}`);
    }
    
    setIsLoading(false);
  };
  
  const handleCategorySelect = async (category: string) => {
    setActiveCategory(category);
    setSearchQuery('');
    setSelectedVideo(null);
    setIsLoading(true);
    setError(null);
    setVideos([]);

    const availableSource = sources.find(s => s.type === 'apple-cms' && (s.status === 'available' || s.status === 'unknown')) || sources.find(s => s.type === 'apple-cms');

    if (!availableSource) {
      setError('没有可用的 CMS 源来加载分类内容。直播源不支持分类浏览。');
      setIsLoading(false);
      return;
    }

    try {
      const categoryId = categoryMap[category];
      const results = await fetchVideos(availableSource, selectedProxy.url, undefined, categoryId ?? undefined);
      setVideos(results);
    } catch (e) {
      const message = e instanceof Error ? e.message : '加载分类数据时发生未知错误。';
      setError(`从 ${availableSource.name} 加载 "${category}" 分类失败: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };


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
    window.scrollTo(0, 0);
  };

  const handleBackToGrid = () => {
    setSelectedVideo(null);
  };

  const groupVideosBySource = (videos: Video[]): Record<string, Video[]> => {
    return videos.reduce((acc, video) => {
      const sourceName = video.sourceName;
      if (!acc[sourceName]) {
        acc[sourceName] = [];
      }
      acc[sourceName].push(video);
      return acc;
    }, {} as Record<string, Video[]>);
  };

  const renderContent = () => {
    if (selectedVideo) {
      const selectedPlayer = defaultPlayers.find(p => p.id === selectedPlayerId) || defaultPlayers[0];
      return <VideoPlayer 
        video={selectedVideo} 
        player={selectedPlayer}
        onBack={handleBackToGrid}
        relatedVideos={videos.filter(v => v.sourceId === selectedVideo.sourceId && v.id !== selectedVideo.id)}
        onSelectVideo={handleSelectVideo}
        />;
    }
    
    const MainContent = () => {
        if (isLoading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;
        }
        if (error) {
        return <div className="flex flex-col items-center justify-center h-auto my-8 text-center text-red-500 p-4 bg-red-50 rounded-lg">
            <h2 className="text-xl font-semibold">加载出错</h2>
            <pre className="text-left text-sm whitespace-pre-wrap mt-2 font-sans">{error}</pre>
            </div>;
        }
        if (!searchQuery.trim() && videos.length === 0 && !isLoading) {
             return (
                <div className="flex flex-col items-center justify-center h-64 text-center text-text-secondary p-4 bg-surface rounded-lg">
                    <SearchIcon className="w-24 h-24 mb-4 text-secondary" />
                    <h2 className="text-2xl font-bold">欢迎使用</h2>
                    <p className="mt-2 max-w-md">使用上方搜索框搜索，或通过底部导航栏按分类浏览。</p>
                </div>
            );
        }
        if (videos.length > 0) {
            const grouped = groupVideosBySource(videos);
            // If browsing a category, don't show the source name header as it's always the same
            if (activeCategory && Object.keys(grouped).length === 1) {
                return <VideoGrid groupedVideos={{ [activeCategory]: videos }} onSelectVideo={handleSelectVideo} />;
            }
            return <VideoGrid groupedVideos={grouped} onSelectVideo={handleSelectVideo} />;
        }
        if (!isLoading) {
        return <div className="flex flex-col items-center justify-center h-64 text-center text-text-secondary p-4 bg-surface rounded-lg">
            <h2 className="text-xl font-semibold">未找到结果</h2>
            <p>"{searchQuery || activeCategory}" 没有返回任何结果。</p>
            </div>;
        }
        return null;
    }
    
    return <div className="p-4 sm:p-6 lg:p-8"><MainContent/></div>;
  };

  return (
    <div className="min-h-screen font-sans pb-16 md:pb-0">
      <SourceManager 
        sources={sources}
        players={defaultPlayers}
        proxies={defaultProxies}
        selectedPlayerId={selectedPlayerId}
        selectedProxyId={selectedProxyId}
        predefinedSources={predefinedSourcesList}
        onAddSource={handleAddSource}
        onDeleteSource={handleDeleteSource}
        onSearch={handleSearch}
        onPlayerChange={setSelectedPlayerId}
        onProxyChange={setSelectedProxyId}
        customProxyUrl={customProxyUrl}
        onSetCustomProxyUrl={setCustomProxyUrl}
        onTestSource={testSingleSource}
        onTestAllSources={testAllSources}
      />
      <main>
        {renderContent()}
      </main>
      <BottomNavBar activeCategory={activeCategory} onSelectCategory={handleCategorySelect} />
    </div>
  );
};

export default App;