import type { Video, Episode, Source } from '../types';

const parseEpisodes = (playUrl: string): Episode[] => {
    if (!playUrl) return [];
    try {
        // Example format: "Episode 1$url1#Episode 2$url2"
        return playUrl.split('#').map(episodeStr => {
            const parts = episodeStr.split('$');
            return { name: parts[0] || '视频', url: parts[1] || '' };
        }).filter(ep => ep.url);
    } catch (e) {
        console.error("Failed to parse episodes", e);
        return [];
    }
}

const transformApiResponse = (apiData: any[], source: Source): Video[] => {
    return apiData.map(item => ({
        id: item.vod_id,
        title: item.vod_name,
        description: item.vod_blurb || '暂无简介。',
        thumbnailUrl: item.vod_pic,
        episodes: parseEpisodes(item.vod_play_url),
        remarks: item.vod_remarks || '',
        sourceName: source.name,
        sourceId: source.id,
        sourceType: source.type,
    }));
}

const parseM3U8 = (m3u8Content: string, source: Source, query?: string): Video[] => {
    const videos: Video[] = [];
    let currentVideoInfo: Partial<Video> & { episodes?: Episode[] } = {};
    const fallbackThumbnail = 'https://via.placeholder.com/300x450.png?text=Live';
    const lines = m3u8Content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXTINF:')) {
            currentVideoInfo = {
                sourceName: source.name,
                sourceId: source.id,
                sourceType: source.type,
            };
            
            const titleMatch = line.match(/,(.*)$/);
            currentVideoInfo.title = titleMatch ? titleMatch[1] : `未知频道 ${i}`;
            currentVideoInfo.id = `${source.id}-${currentVideoInfo.title}-${i}`;

            const logoMatch = line.match(/tvg-logo="([^"]*)"/);
            currentVideoInfo.thumbnailUrl = logoMatch && logoMatch[1] ? logoMatch[1] : fallbackThumbnail;
            
            currentVideoInfo.description = `直播频道: ${currentVideoInfo.title}`;
            currentVideoInfo.remarks = '直播';

        } else if (line.length > 0 && !line.startsWith('#')) {
            if (currentVideoInfo.title) {
                currentVideoInfo.episodes = [{ name: '播放', url: line }];
                
                if (!query || currentVideoInfo.title.toLowerCase().includes(query.toLowerCase())) {
                    videos.push(currentVideoInfo as Video);
                }
            }
            currentVideoInfo = {};
        }
    }
    return videos;
};

const constructProxyUrl = (proxyUrl: string, targetUrl: string): string => {
    if (!proxyUrl || proxyUrl.trim() === '') {
        return targetUrl;
    }
    // Query-based proxy (e.g., https://corsproxy.io/?)
    if (proxyUrl.includes('?')) {
        return `${proxyUrl}${encodeURIComponent(targetUrl)}`;
    }
    // Path-based proxy (e.g., /api/proxy/ or https://cors.eu.org/)
    return `${proxyUrl}${targetUrl}`;
};


const fetchVideosFromM3U8 = async (source: Source, proxyUrl: string, query?: string): Promise<Video[]> => {
    const targetUrl = source.url;
    const finalUrl = constructProxyUrl(proxyUrl, targetUrl);
    try {
        const response = await fetch(finalUrl);
        if (!response.ok) {
            throw new Error(`网络响应错误: ${response.status} ${response.statusText}`);
        }
        const m3u8Content = await response.text();
        if (m3u8Content.trim().startsWith('<')) {
            throw new Error('API返回了意外的格式 (XML/HTML)，而不是有效的 M3U8 播放列表。');
        }
        return parseM3U8(m3u8Content, source, query);
    } catch (error) {
        console.error(`从 ${source.name} 获取或解析 M3U8 失败:`, error);
        if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
            throw new Error(`无法从 ${source.name} 获取数据。这通常是由于网络问题、CORS 跨域限制或混合内容（在 HTTPS 页面请求 HTTP 资源）。\n\n请尝试在“设置”中切换或配置一个有效的 CORS 代理来解决此问题。`);
        }
        throw new Error(`从 ${source.name} 获取 M3U8 数据失败。 (${error instanceof Error ? error.message : '未知错误'})`);
    }
};

const fetchVideosFromAppleCMS = async (source: Source, proxyUrl: string, query?: string, categoryId?: string): Promise<Video[]> => {
    const apiUrl = new URL(source.url);
    // Standard parameter for fetching video lists in Apple CMS v10.
    apiUrl.searchParams.append('ac', 'detail'); 
    if (query) {
      apiUrl.searchParams.append('wd', query);
    } else if (categoryId) {
      apiUrl.searchParams.append('t', categoryId);
    }
  
    const targetUrl = apiUrl.toString();
    const finalUrl = constructProxyUrl(proxyUrl, targetUrl);
  
    try {
      const response = await fetch(finalUrl);
  
      if (!response.ok) {
        throw new Error(`网络响应错误: ${response.status} ${response.statusText}`);
      }
  
      const responseText = await response.text();
      let data;
  
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        if (query && (responseText.includes('暂不支持搜索') || responseText.includes('禁止搜索'))) {
          console.warn(`Source ${source.name} does not support search, returning empty results.`);
          return [];
        }
        if (responseText.trim().startsWith('<')) {
          throw new Error('API返回了意外的格式 (XML/HTML)。请检查源URL是否为有效的 Apple CMS v10 JSON API。');
        }
        throw new Error(`解析JSON响应失败。API可能配置错误或响应为空。 (错误: ${parseError instanceof Error ? parseError.message : '未知解析错误'})`);
      }
  
      if (data.code !== 1 && data.total === 0) {
          return [];
      }
  
      if (data.code !== 1) {
        throw new Error(data.msg || 'API返回了一个错误。');
      }
  
      if (!data.list || !Array.isArray(data.list)) {
          if (data.total === 0) return [];
          throw new Error('无效的API响应格式：缺少 "list" 属性或该属性不是一个数组。');
      }
  
      return transformApiResponse(data.list, source);
  
    } catch (error) {
        console.error(`从 ${source.name} 获取或解析视频失败:`, error);
        if (error instanceof TypeError && error.message.toLowerCase().includes('failed to fetch')) {
            throw new Error(`无法从 ${source.name} 获取数据。这通常是由于网络问题、CORS 跨域限制或混合内容（在 HTTPS 页面请求 HTTP 资源）。\n\n请尝试在“设置”中切换或配置一个有效的 CORS 代理来解决此问题。`);
        }
        throw new Error(`从 ${source.name} 获取数据失败。 (${error instanceof Error ? error.message : '未知错误'})`);
    }
};


export const fetchVideos = async (source: Source, proxyUrl: string, query?: string, categoryId?: string): Promise<Video[]> => {
  if (source.type === 'm3u8') {
    // M3U8 sources don't support category browsing.
    if (categoryId) return [];
    return fetchVideosFromM3U8(source, proxyUrl, query);
  }
  return fetchVideosFromAppleCMS(source, proxyUrl, query, categoryId);
};