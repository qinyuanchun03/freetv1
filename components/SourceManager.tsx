
import React, { useState, useEffect } from 'react';
import type { Source, Player } from '../types';
import { 
  PlusIcon, 
  TrashIcon, 
  CloseIcon, 
  RefreshIcon, 
  TvIcon, 
  ServerStackIcon, 
  CloudArrowDownIcon, 
  Cog6ToothIcon,
  SearchIcon,
  GlobeIcon,
  CircleStackIcon,
  FilmIcon,
  WifiIcon,
  ListBulletIcon
} from './icons';

interface SourceManagerProps {
  sources: Source[];
  players: Player[];
  selectedPlayerId: string;
  predefinedSources: Array<{ name: string; url: string; type: 'apple-cms' | 'm3u8' }>;
  corsProxyUrl: string;
  onAddSource: (source: { name: string, url: string }) => void;
  onDeleteSource: (id: string) => void;
  onSearch: (query: string) => void;
  onPlayerChange: (id: string) => void;
  onTestSource: (id: string) => void;
  onTestAllSources: () => void;
  onCorsProxyUrlChange: (url: string) => void;
  onGoHome: () => void;
}

type SettingsTab = 'manage' | 'add' | 'player' | 'system';

const SettingsModal: React.FC<{
  sources: Source[];
  players: Player[];
  selectedPlayerId: string;
  predefinedSources: Array<{ name: string; url: string; type: 'apple-cms' | 'm3u8' }>;
  corsProxyUrl: string;
  onAddSource: (source: { name: string, url: string }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onPlayerChange: (id: string) => void;
  onTestSource: (id: string) => void;
  onTestAllSources: () => void;
  onCorsProxyUrlChange: (url: string) => void;
}> = ({ sources, players, selectedPlayerId, predefinedSources, corsProxyUrl, onAddSource, onDelete, onClose, onPlayerChange, onTestSource, onTestAllSources, onCorsProxyUrlChange }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('manage');
    const [newSourceUrl, setNewSourceUrl] = useState('');
    const [cacheSize, setCacheSize] = useState<string>('0 KB');
    
    // Prevent body scroll when modal is open
    useEffect(() => {
      document.body.style.overflow = 'hidden';
      calculateCacheSize();
      return () => {
        document.body.style.overflow = '';
      };
    }, []);

    const calculateCacheSize = () => {
        let total = 0;
        for(let x in localStorage) {
            if(x.startsWith('cms-cache')) {
                total += ((localStorage[x].length * 2));
            }
        }
        const sizeInKB = total / 1024;
        setCacheSize(sizeInKB > 1024 ? `${(sizeInKB/1024).toFixed(2)} MB` : `${sizeInKB.toFixed(2)} KB`);
    };

    const handleClearCache = () => {
        const keysToRemove = [];
        for(let x in localStorage) {
            if(x.startsWith('cms-cache')) {
                keysToRemove.push(x);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        calculateCacheSize();
        alert("API 缓存已清除。");
    };

    const handleAddManualSource = () => {
        const url = newSourceUrl.trim();
        if (url) {
            try {
                const urlObject = new URL(url);
                const name = urlObject.hostname.replace('www.', '');
                onAddSource({ name, url });
                setNewSourceUrl('');
                setActiveTab('manage');
            } catch (e) {
                alert("无效的URL。");
            }
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAddManualSource();
        }
    };
    
    const statusClasses = {
        available: 'bg-green-500 ring-green-200',
        unavailable: 'bg-red-500 ring-red-200',
        testing: 'bg-yellow-500 ring-yellow-200 animate-pulse',
        unknown: 'bg-gray-300 ring-gray-100',
    };

    const TabButton = ({ id, icon: Icon, label, subtitle }: { id: SettingsTab, icon: any, label: string, subtitle?: string }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-3 px-4 py-3 w-full text-left transition-all duration-200 rounded-xl group
        ${activeTab === id 
            ? 'bg-white shadow-md text-primary border border-primary/10' 
            : 'text-text-secondary hover:bg-white/60 hover:text-text-primary'
        }`}
      >
        <div className={`p-2 rounded-lg transition-colors ${activeTab === id ? 'bg-primary/10' : 'bg-transparent group-hover:bg-gray-100'}`}>
             <Icon className={`w-5 h-5 flex-shrink-0 ${activeTab === id ? 'text-primary' : 'text-text-secondary'}`} />
        </div>
        <div className="flex flex-col">
            <span className={`font-bold text-sm ${activeTab === id ? 'text-text-primary' : ''}`}>{label}</span>
            {subtitle && <span className="text-[10px] text-text-secondary opacity-80 font-medium hidden lg:block">{subtitle}</span>}
        </div>
      </button>
    );

    const MobileTab = ({ id, label, icon: Icon }: { id: SettingsTab, label: string, icon: any }) => (
         <button 
            onClick={() => setActiveTab(id)}
            className={`flex items-center justify-center px-4 py-3 gap-2 rounded-full transition-all whitespace-nowrap ${
                activeTab === id 
                ? 'bg-primary text-white font-bold shadow-md shadow-primary/20' 
                : 'bg-gray-100 text-text-secondary font-medium'
            }`}
        >
            <Icon className="w-4 h-4" />
            <span className="text-xs">{label}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose} />
            
            {/* Main Modal Card */}
            <div 
                className="relative bg-gray-50 w-full max-w-5xl h-[85vh] max-h-[800px] rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-scaleIn z-10 ring-1 ring-black/5" 
                onClick={e => e.stopPropagation()}
            >
                {/* Desktop Sidebar */}
                <div className="hidden md:flex w-72 bg-gray-100/80 backdrop-blur-xl flex-col border-r border-gray-200 flex-shrink-0">
                    <div className="p-6 pb-4">
                      <h2 className="text-xl font-extrabold text-text-primary flex items-center gap-2.5 tracking-tight">
                        <div className="p-2 bg-gradient-to-br from-primary to-green-600 rounded-xl text-white shadow-lg shadow-primary/30">
                            <Cog6ToothIcon className="w-5 h-5" />
                        </div>
                        设置中心
                      </h2>
                    </div>
                    
                    <div className="flex-1 px-4 space-y-2 overflow-y-auto py-2 scrollbar-thin">
                        <p className="px-2 text-[10px] font-extrabold text-text-secondary/50 uppercase tracking-widest mb-2 mt-2">资源管理</p>
                        <TabButton id="manage" icon={ListBulletIcon} label="我的订阅" subtitle={`已添加 ${sources.length} 个接口`} />
                        <TabButton id="add" icon={CloudArrowDownIcon} label="添加订阅" subtitle="支持 CMS 和 M3U8" />
                        
                        <div className="my-4 border-t border-gray-200/60 mx-2"></div>
                        
                        <p className="px-2 text-[10px] font-extrabold text-text-secondary/50 uppercase tracking-widest mb-2">系统偏好</p>
                        <TabButton id="player" icon={FilmIcon} label="播放偏好" subtitle="切换播放引擎" />
                        <TabButton id="system" icon={WifiIcon} label="网络与高级" subtitle="代理与缓存管理" />
                    </div>
                    
                    <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                        <button onClick={onClose} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-text-secondary hover:text-white bg-white hover:bg-red-500 transition-all w-full rounded-xl shadow-sm border border-gray-200 hover:border-red-500 hover:shadow-red-500/30 active:scale-95">
                            <CloseIcon className="w-4 h-4" />
                            <span>关闭设置</span>
                        </button>
                    </div>
                </div>

                {/* Mobile Header & Tabs */}
                <div className="md:hidden flex flex-col flex-shrink-0 bg-surface z-20 shadow-sm">
                    <div className="flex items-center justify-between p-4 border-b border-border-color/50">
                         <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                <Cog6ToothIcon className="w-5 h-5" />
                            </div>
                            设置
                         </h2>
                         <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-text-secondary hover:text-text-primary active:scale-90 transition-transform">
                             <CloseIcon className="w-5 h-5" />
                         </button>
                    </div>
                    <div className="flex items-center gap-2 p-3 overflow-x-auto hide-scrollbar bg-gray-50">
                        <MobileTab id="manage" label="订阅列表" icon={ListBulletIcon} />
                        <MobileTab id="add" label="添加源" icon={CloudArrowDownIcon} />
                        <MobileTab id="player" label="播放器" icon={FilmIcon} />
                        <MobileTab id="system" label="高级" icon={WifiIcon} />
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative flex flex-col bg-white">
                    <div className="flex-1 overflow-y-auto p-5 sm:p-8 scroll-smooth">
                      
                      {/* --- TAB: MANAGE SOURCES --- */}
                      {activeTab === 'manage' && (
                        <div className="space-y-6 animate-fadeIn pb-12 max-w-3xl mx-auto">
                          <div className="flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10 py-2 mb-2">
                              <div>
                                  <h3 className="text-xl font-bold text-text-primary">已订阅的视频源</h3>
                                  <p className="text-sm text-text-secondary mt-0.5">管理、测试或移除已添加的接口</p>
                              </div>
                              <button 
                                onClick={onTestAllSources} 
                                className="flex items-center gap-2 text-xs bg-primary text-white px-4 py-2.5 rounded-xl hover:bg-primary-hover transition-all duration-300 font-bold shadow-lg shadow-primary/30 active:scale-95"
                              >
                                  <RefreshIcon className="w-4 h-4" />
                                  <span className="hidden sm:inline">全部测试</span>
                              </button>
                          </div>
                          
                          {sources.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {sources.map(source => (
                                <div key={source.id} className="group flex items-center justify-between bg-gray-50 border border-gray-100 hover:border-primary/30 hover:bg-white p-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                                    <div className="flex-1 overflow-hidden min-w-0">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-3 h-3 rounded-full ring-2 ring-white shadow-sm ${statusClasses[source.status || 'unknown']}`}></div>
                                          <h3 className="font-bold text-text-primary truncate text-base">{source.name}</h3>
                                      </div>
                                      <div className="flex items-center gap-2 mt-2">
                                         <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md uppercase border ${source.type === 'm3u8' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                              {source.type === 'm3u8' ? '直播流' : 'CMS API'}
                                          </span>
                                        {source.latency !== undefined && source.status === 'available' && (
                                            <span className="text-[10px] font-mono text-green-700 bg-green-100/50 px-1.5 py-0.5 rounded border border-green-100">
                                              {source.latency}ms
                                            </span>
                                        )}
                                        <p className="text-xs text-text-secondary truncate font-mono opacity-60 select-all hover:opacity-100 transition-opacity max-w-[200px] sm:max-w-sm">{source.url}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-3">
                                      <button
                                        onClick={() => onTestSource(source.id)}
                                        className="p-2.5 text-gray-400 hover:text-primary hover:bg-white hover:shadow-md rounded-xl transition-all active:scale-90"
                                        title="测试连接"
                                      >
                                          <RefreshIcon className="w-5 h-5" />
                                      </button>
                                      <button 
                                        onClick={() => onDelete(source.id)} 
                                        className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-md rounded-xl transition-all active:scale-90"
                                        title="删除源"
                                      >
                                        <TrashIcon className="w-5 h-5" />
                                      </button>
                                    </div>
                                </div>
                                ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-text-secondary border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
                              <ServerStackIcon className="w-16 h-16 mb-4 text-gray-300" />
                              <p className="text-base font-medium">暂无已配置的源</p>
                              <button onClick={() => setActiveTab('add')} className="mt-4 text-primary text-sm font-bold hover:underline bg-primary/10 px-4 py-2 rounded-lg">前往添加</button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* --- TAB: ADD SOURCE --- */}
                      {activeTab === 'add' && (
                        <div className="space-y-10 animate-fadeIn pb-12 max-w-3xl mx-auto">
                          <div className="bg-gradient-to-br from-primary/5 to-transparent p-6 rounded-3xl border border-primary/10">
                              <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                手动订阅
                              </h3>
                              <div className="flex flex-col sm:flex-row gap-3">
                                  <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={newSourceUrl}
                                        onChange={(e) => setNewSourceUrl(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="输入 CMS API 或 M3U8 地址..."
                                        className="w-full h-12 bg-white border border-gray-200 rounded-xl px-4 text-sm shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-gray-400"
                                    />
                                  </div>
                                  <button
                                      onClick={handleAddManualSource}
                                      className="bg-primary hover:bg-primary-hover active:scale-95 text-white px-8 h-12 rounded-xl transition-all duration-200 shadow-lg shadow-primary/25 font-bold flex items-center justify-center gap-2"
                                  >
                                      <PlusIcon className="w-5 h-5" />
                                      <span>添加</span>
                                  </button>
                              </div>
                              <p className="text-xs text-text-secondary mt-3 opacity-80">
                                  支持 <span className="font-mono bg-white px-1 rounded border border-black/5">/api.php/provide/vod/</span> 格式的苹果 CMS 接口或 M3U8 直播流。
                              </p>
                          </div>

                          <section>
                            <h3 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-gray-300 rounded-full"></span>
                                推荐订阅源
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {predefinedSources.map(predefSource => {
                                const isAdded = sources.some(s => s.url === predefSource.url);
                                return (
                                  <div key={predefSource.url} className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${isAdded ? 'bg-gray-50 border-transparent opacity-50' : 'bg-white border-gray-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5'}`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${isAdded ? 'bg-gray-200 text-gray-500' : 'bg-gradient-to-br from-primary/10 to-primary/5 text-primary'}`}>
                                        {predefSource.name.substring(0,1)}
                                      </div>
                                      <div className="min-w-0 flex flex-col">
                                        <span className="text-sm font-bold text-text-primary truncate">{predefSource.name}</span>
                                        <span className="text-[10px] text-text-secondary truncate uppercase tracking-wide font-semibold mt-0.5">{predefSource.type}</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => onAddSource(predefSource)}
                                      disabled={isAdded}
                                      className={`text-xs px-4 py-2 rounded-lg font-bold transition-all ${
                                        isAdded 
                                          ? 'text-text-secondary bg-transparent cursor-not-allowed' 
                                          : 'bg-text-primary text-white hover:bg-primary hover:shadow-primary/30 active:scale-95 shadow-lg'
                                      }`}
                                    >
                                      {isAdded ? '已添加' : '添加'}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        </div>
                      )}

                       {/* --- TAB: PLAYER SETTINGS --- */}
                       {activeTab === 'player' && (
                         <div className="space-y-8 animate-fadeIn pb-12 max-w-3xl mx-auto">
                           <div className="mb-6">
                               <h3 className="text-xl font-bold text-text-primary">播放引擎选择</h3>
                               <p className="text-sm text-text-secondary mt-1">选择适合您设备的解码方式</p>
                           </div>

                           <div className="grid grid-cols-1 gap-4">
                              {players.map(p => (
                                <label 
                                  key={p.id}
                                  className={`cursor-pointer relative border-2 rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 ${
                                    selectedPlayerId === p.id 
                                      ? 'bg-primary/5 border-primary shadow-xl shadow-primary/10' 
                                      : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedPlayerId === p.id ? 'border-primary' : 'border-gray-300'}`}>
                                        {selectedPlayerId === p.id && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-base font-bold ${selectedPlayerId === p.id ? 'text-primary' : 'text-text-primary'}`}>{p.name}</span>
                                            {p.type === 'dplayer' && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">推荐</span>}
                                        </div>
                                        <p className="text-xs text-text-secondary mt-1">
                                            {p.type === 'dplayer' 
                                                ? '使用 HTML5 原生播放器，支持 HLS/M3U8 硬解码，无广告，体验最佳。' 
                                                : '使用第三方 iframe 解析服务，兼容性强但可能包含第三方广告。'}
                                        </p>
                                    </div>
                                    <input 
                                        type="radio" 
                                        name="player" 
                                        value={p.id} 
                                        checked={selectedPlayerId === p.id} 
                                        onChange={() => onPlayerChange(p.id)}
                                        className="absolute opacity-0"
                                    />
                                </label>
                              ))}
                           </div>
                         </div>
                       )}

                      {/* --- TAB: SYSTEM & NETWORK --- */}
                      {activeTab === 'system' && (
                        <div className="space-y-8 animate-fadeIn pb-12 max-w-3xl mx-auto">
                           
                           {/* CORS Proxy Section */}
                           <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="mb-5">
                                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                                            <GlobeIcon className="w-5 h-5" />
                                        </div>
                                        网络代理 (CORS Proxy)
                                    </h3>
                                    <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                                        Web 播放器需要跨域代理来访问 HTTP 视频流。如果视频无法播放或源检测失败，请尝试更换代理。
                                    </p>
                                </div>
                                
                                <div className="relative group">
                                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                      <ServerStackIcon className="w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                                  </div>
                                  <input
                                    type="text"
                                    value={corsProxyUrl}
                                    onChange={(e) => onCorsProxyUrlChange(e.target.value)}
                                    placeholder="https://proxy.example.com/?url="
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm font-mono focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-text-primary"
                                  />
                                </div>
                                <div className="mt-3 flex items-start gap-2 p-3 bg-orange-50 text-orange-800 text-xs rounded-xl border border-orange-100/50">
                                    <span className="mt-0.5">⚠️</span>
                                    <p>请使用支持 CORS 头的代理服务。公共代理可能不稳定。</p>
                                </div>
                           </section>

                           {/* Data Management Section */}
                           <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="mb-5">
                                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                                        <div className="p-1.5 bg-purple-50 text-purple-500 rounded-lg">
                                            <CircleStackIcon className="w-5 h-5" />
                                        </div>
                                        数据与缓存
                                    </h3>
                                    <p className="text-xs text-text-secondary mt-2">
                                        管理应用在您浏览器中存储的 API 响应数据。
                                    </p>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div>
                                        <h4 className="text-sm font-bold text-text-primary">API 响应缓存</h4>
                                        <p className="text-xs text-text-secondary mt-1 font-mono">占用空间: {cacheSize}</p>
                                    </div>
                                    <button 
                                        onClick={handleClearCache}
                                        className="text-xs font-bold text-red-500 hover:text-white border border-red-200 hover:bg-red-500 px-4 py-2 rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-red-500/20"
                                    >
                                        立即清除
                                    </button>
                                </div>
                           </section>
                        </div>
                      )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export const SourceManager: React.FC<SourceManagerProps> = ({
  sources,
  players,
  selectedPlayerId,
  predefinedSources,
  corsProxyUrl,
  onAddSource,
  onDeleteSource,
  onSearch,
  onPlayerChange,
  onTestSource,
  onTestAllSources,
  onCorsProxyUrlChange,
  onGoHome,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(searchQuery);
    }
  };

  return (
    <>
      {isSettingsOpen && <SettingsModal 
        sources={sources} 
        players={players}
        selectedPlayerId={selectedPlayerId}
        predefinedSources={predefinedSources}
        corsProxyUrl={corsProxyUrl}
        onAddSource={onAddSource} 
        onDelete={onDeleteSource} 
        onClose={() => setIsSettingsOpen(false)} 
        onPlayerChange={onPlayerChange}
        onTestSource={onTestSource}
        onTestAllSources={onTestAllSources}
        onCorsProxyUrlChange={onCorsProxyUrlChange}
      />}
      <header className="bg-surface/90 backdrop-blur-xl border-b border-border-color/80 sticky top-0 z-40 transition-all duration-300 shadow-sm supports-[backdrop-filter]:bg-surface/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3 sm:gap-6">
          <button onClick={onGoHome} className="flex items-center space-x-2 cursor-pointer group focus:outline-none select-none">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30 transition-transform group-hover:scale-105 group-active:scale-95 ring-2 ring-transparent group-hover:ring-primary/20">
              <TvIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-text-primary hidden sm:block tracking-tight">JiangHu<span className="text-primary">在线影视</span></h1>
          </button>
          
          <div className="flex-1 max-w-lg relative group z-10">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
               <SearchIcon className="w-5 h-5 text-text-secondary group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="搜索电影、剧集..."
              className="w-full bg-gray-100/70 hover:bg-white focus:bg-white border border-transparent focus:border-primary/30 rounded-2xl pl-10 pr-12 py-2.5 text-sm focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 shadow-inner focus:shadow-lg focus:shadow-primary/5"
            />
            <div className="absolute inset-y-0 right-1.5 flex items-center">
               <button 
                  onClick={() => onSearch(searchQuery)}
                  className="p-1.5 bg-primary text-white rounded-xl opacity-0 group-focus-within:opacity-100 hover:bg-primary-hover transition-all duration-200 scale-90 group-focus-within:scale-100 shadow-sm"
                >
                  <SearchIcon className="w-4 h-4" />
               </button>
            </div>
          </div>
  
          <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-xl transition-colors focus:outline-none active:scale-90 transform"
              aria-label="设置"
          >
              <Cog6ToothIcon className="w-6 h-6" />
          </button>
        </div>
      </header>
    </>
  );
};
