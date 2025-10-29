import type { Video, Episode, Source } from '../types';

// 从一个写死的常量变为一个可配置的变量，以支持用户自定义代理。
let proxyConfig = { 
    prefix: 'https://cross.250221.xyz/?url=', 
    encode: true 
};

/**
 * 设置用于所有后续请求的CORS代理URL。
 * @param {string} url - 新的代理服务器URL。
 */
export const setProxyUrl = (url: string) => {
    if (url && typeof url === 'string' && url.trim().length > 0) {
        proxyConfig.prefix = url;
    }
};

const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 小时

// --- 缓存工具 ---
const getCache = <T>(key: string): T | null => {
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return null;

    try {
        const { data, expiry } = JSON.parse(cachedItem);
        if (Date.now() > expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return data as T;
    } catch (e) {
        localStorage.removeItem(key);
        return null;
    }
};

const setCache = (key: string, data: any) => {
    const item = {
        data,
        expiry: Date.now() + CACHE_DURATION,
    };
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.error("写入localStorage失败:", e);
    }
};

const fetchWithProxy = async (url: string): Promise<Response> => {
    const targetUrl = proxyConfig.encode ? encodeURIComponent(url) : url;
    const proxyUrl = `${proxyConfig.prefix}${targetUrl}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`代理响应错误: ${response.status} ${response.statusText}`);
        }
        return response;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知网络错误';
        console.error(`代理请求失败，URL: ${url}`, errorMessage);
        // 向上抛出错误，由调用方添加更多上下文信息
        throw new Error(`代理请求失败: ${errorMessage}`);
    }
};


const parseEpisodes = (playUrl: string): Episode[] => {
    if (!playUrl) return [];
    try {
        // 示例格式: "第1集$url1#第2集$url2"
        return playUrl.split('#').map(episodeStr => {
            const parts = episodeStr.split('$');
            return { name: parts[0] || '视频', url: parts[1] || '' };
        }).filter(ep => ep.url);
    } catch (e) {
        console.error("解析剧集失败", e);
        return [];
    }
}

const transformApiResponse = (apiData: any[], source: Source): Video[] => {
    return apiData.map(item => ({
        id: String(item.vod_id),
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


const fetchVideosFromM3U8 = async (source: Source, query?: string): Promise<Video[]> => {
    const cacheKey = `cms-cache-${source.url}-${query || ''}`;
    const cachedData = getCache<Video[]>(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    try {
        const response = await fetchWithProxy(source.url);
        if (!response.ok) {
            throw new Error(`网络响应错误: ${response.status}`);
        }
        const m3u8Content = await response.text();
        if (m3u8Content.trim().startsWith('<')) {
            throw new Error('API返回了意外的格式 (XML/HTML)，而不是有效的 M3U8 播放列表。');
        }
        const parsedData = parseM3U8(m3u8Content, source, query);
        setCache(cacheKey, parsedData);
        return parsedData;
    } catch (error) {
        console.error(`从 ${source.name} 获取或解析 M3U8 失败:`, error);
        throw new Error(`从 ${source.name} 获取 M3U8 数据失败。 (${error instanceof Error ? error.message : '未知错误'})`);
    }
};

const fetchVideosFromAppleCMS = async (source: Source, query?: string, categoryId?: string): Promise<Video[]> => {
    const cacheKey = `cms-cache-${source.url}-${query || ''}-${categoryId || ''}`;
    const cachedData = getCache<Video[]>(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const apiUrl = new URL(source.url);
    apiUrl.searchParams.append('ac', 'detail'); 
    if (query) {
      apiUrl.searchParams.append('wd', query);
    } else if (categoryId) {
      apiUrl.searchParams.append('t', categoryId);
    }
  
    try {
      const response = await fetchWithProxy(apiUrl.toString());
  
      if (!response.ok) {
        throw new Error(`网络响应错误: ${response.status} ${response.statusText}`);
      }
  
      const responseText = await response.text();
      let data;
  
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        if (query && (responseText.includes('暂不支持搜索') || responseText.includes('禁止搜索'))) {
          console.warn(`源 ${source.name} 不支持搜索，返回空结果。`);
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
      
      const transformedData = transformApiResponse(data.list, source);
      setCache(cacheKey, transformedData);
      return transformedData;
  
    } catch (error) {
      console.error(`从 ${source.name} 获取或解析视频失败:`, error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
          throw new Error('无法获取数据。这可能是网络问题或代理服务器已关闭。请检查您的网络连接。');
      }
      throw new Error(`从 ${source.name} 获取数据失败。 (${error instanceof Error ? error.message : '未知错误'})`);
    }
};


export const fetchVideos = async (source: Source, query?: string, categoryId?: string): Promise<Video[]> => {
  if (source.type === 'm3u8') {
    if (categoryId) return [];
    return fetchVideosFromM3U8(source, query);
  }
  return fetchVideosFromAppleCMS(source, query, categoryId);
};