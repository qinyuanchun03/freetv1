import React, { useState } from 'react';
import type { Source, Player } from '../types';
// FIX: Import TvIcon to resolve reference error.
import { PlusIcon, TrashIcon, CloseIcon, RefreshIcon, TvIcon } from './icons';

interface SourceManagerProps {
  sources: Source[];
  players: Player[];
  selectedPlayerId: string;
  predefinedSources: Array<{ name: string; url: string; type: 'apple-cms' | 'm3u8' }>;
  onAddSource: (source: { name: string, url: string }) => void;
  onDeleteSource: (id: string) => void;
  onSearch: (query: string) => void;
  onPlayerChange: (id: string) => void;
  onTestSource: (id: string) => void;
  onTestAllSources: () => void;
}

const SettingsModal: React.FC<{
  sources: Source[];
  players: Player[];
  selectedPlayerId: string;
  predefinedSources: Array<{ name: string; url: string; type: 'apple-cms' | 'm3u8' }>;
  onAddSource: (source: { name: string, url: string }) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onPlayerChange: (id: string) => void;
  onTestSource: (id: string) => void;
  onTestAllSources: () => void;
}> = ({ sources, players, selectedPlayerId, predefinedSources, onAddSource, onDelete, onClose, onPlayerChange, onTestSource, onTestAllSources }) => {
    const [newSourceUrl, setNewSourceUrl] = useState('');

    const handleAddManualSource = () => {
        const url = newSourceUrl.trim();
        if (url) {
            try {
                const urlObject = new URL(url);
                const name = urlObject.hostname.replace('www.', '');
                onAddSource({ name, url });
                setNewSourceUrl('');
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
        available: 'bg-green-500',
        unavailable: 'bg-red-500',
        testing: 'bg-yellow-500 animate-pulse',
        unknown: 'bg-gray-400',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-surface rounded-lg p-6 w-full max-w-2xl shadow-xl flex flex-col h-[85vh] sm:h-[75vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-border-color">
                    <h2 className="text-2xl font-bold text-text-primary">设置</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">我的源</h3>
                        <button onClick={onTestAllSources} className="text-sm bg-secondary text-white px-3 py-1 rounded-md hover:bg-slate-600 transition-colors">
                            测试全部
                        </button>
                    </div>
                    {sources.length > 0 ? (
                      <ul className="space-y-2">
                          {sources.map(source => (
                          <li key={source.id} className="flex items-center justify-between bg-background p-3 rounded-md">
                              <div className="flex-1 overflow-hidden">
                                <div className="flex items-center space-x-2">
                                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusClasses[source.status || 'unknown']}`}></span>
                                    <div className="font-medium text-text-primary truncate flex items-center">
                                      <p className="truncate">{source.name}</p>
                                      <span className={`text-xs font-semibold ml-2 px-2 py-0.5 rounded-full ${source.type === 'm3u8' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                          {source.type === 'm3u8' ? 'M3U8' : 'CMS'}
                                      </span>
                                    </div>
                                </div>
                                <p className="text-sm text-text-secondary ml-4 truncate">{source.url}</p>
                              </div>
                              <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                <button
                                  onClick={() => onTestSource(source.id)}
                                  className="text-text-secondary hover:text-primary p-1 rounded-full transition-colors"
                                  aria-label={`测试 ${source.name}`}
                                >
                                    <RefreshIcon className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => onDelete(source.id)} 
                                  className="text-red-500 hover:text-red-700 p-1 rounded-full transition-colors"
                                  aria-label={`删除 ${source.name}`}
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                          </li>
                          ))}
                      </ul>
                    ) : (
                      <p className="text-text-secondary text-center py-4">未配置任何源。</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">添加推荐源</h3>
                    <div className="max-h-60 overflow-y-auto border border-border-color rounded-md p-2 bg-background">
                      <ul className="space-y-2">
                        {predefinedSources.map(predefSource => {
                          const isAdded = sources.some(s => s.url === predefSource.url);
                          return (
                            <li key={predefSource.url} className="flex items-center justify-between bg-surface p-2 rounded-md shadow-sm">
                              <span className="text-sm text-text-primary flex-1 truncate pr-2">{predefSource.name}</span>
                              <button
                                onClick={() => onAddSource(predefSource)}
                                disabled={isAdded}
                                className={`text-sm px-3 py-1 rounded-md font-medium transition-colors flex-shrink-0 ${
                                  isAdded 
                                    ? 'bg-gray-200 text-text-secondary cursor-not-allowed' 
                                    : 'bg-primary text-white hover:bg-primary-hover'
                                }`}
                              >
                                {isAdded ? '已添加' : '添加'}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                   <div>
                      <h3 className="text-lg font-semibold text-text-primary mb-2">手动添加源</h3>
                      <p className="text-text-secondary mb-3 text-sm">输入 Apple CMS v10 API 或 M3U8 播放列表的 URL。</p>
                      <div className="flex space-x-2">
                          <input
                              type="text"
                              value={newSourceUrl}
                              onChange={(e) => setNewSourceUrl(e.target.value)}
                              onKeyDown={handleKeyDown}
                              placeholder="http://my-cms.com/api.php/provide/vod/ 或 .../playlist.m3u8"
                              className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                          />
                          <button
                              onClick={handleAddManualSource}
                              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover transition-colors flex-shrink-0 font-semibold text-sm"
                          >
                              添加
                          </button>
                      </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border-color">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">播放器设置</h3>
                    <p className="text-text-secondary mb-3 text-sm">选择用于播放视频的默认播放器。</p>
                    <select
                        value={selectedPlayerId}
                        onChange={(e) => onPlayerChange(e.target.value)}
                        className="w-full bg-background border border-border-color rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        aria-label="选择播放器"
                    >
                        {players.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}

// Omitted the SourceManager export component for brevity, as it only passes props down to SettingsModal.
// The structure remains the same. The real changes are in SettingsModal and App.tsx.

export const SourceManager: React.FC<SourceManagerProps> = ({
  sources,
  players,
  selectedPlayerId,
  predefinedSources,
  onAddSource,
  onDeleteSource,
  onSearch,
  onPlayerChange,
  onTestSource,
  onTestAllSources,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="bg-surface shadow-sm p-4 sticky top-0 z-40">
      {isSettingsOpen && <SettingsModal 
        sources={sources} 
        players={players}
        selectedPlayerId={selectedPlayerId}
        predefinedSources={predefinedSources}
        onAddSource={onAddSource} 
        onDelete={onDeleteSource} 
        onClose={() => setIsSettingsOpen(false)} 
        onPlayerChange={onPlayerChange}
        onTestSource={onTestSource}
        onTestAllSources={onTestAllSources}
      />}
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <TvIcon className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold text-text-primary hidden sm:block">CMS 播放器</h1>
        </div>
        
        <div className="flex-1 max-w-xl flex items-center">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="搜索所有可用源..."
            className="w-full bg-background border border-border-color rounded-l-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
          <button 
            onClick={() => onSearch(searchQuery)}
            className="bg-primary text-white p-2 rounded-r-full hover:bg-primary-hover transition-colors"
            aria-label="搜索"
            >
             <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </div>

        <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-text-secondary hover:text-primary transition-colors"
            aria-label="设置"
        >
            <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-1.007 1.11-1.226.554-.22 1.197-.22 1.752 0 .548.219 1.018.684 1.11 1.226M9.75 12.75c0 .414.336.75.75.75h3.75a.75.75 0 0 0 .75-.75V12a.75.75 0 0 0-.75-.75H10.5a.75.75 0 0 0-.75.75v.75Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
            </svg>
        </button>
      </div>
    </header>
  );
};