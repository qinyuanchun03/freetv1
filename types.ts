export interface Source {
  id: string;
  name: string;
  url: string;
  type: 'apple-cms' | 'm3u8';
  status?: 'unknown' | 'testing' | 'available' | 'unavailable';
}

export interface Episode {
  name: string;
  url: string;
}

export interface Video {
  id: number | string;
  title: string;
  description: string;
  thumbnailUrl: string;
  episodes: Episode[];
  remarks: string; // e.g., "HD", "Updated to Ep. 10"
  sourceName: string;
  sourceId: string;
  sourceType: 'apple-cms' | 'm3u8';
}

export interface Player {
  id: string;
  name: string;
  type: 'dplayer' | 'iframe';
  url?: string; // Only for iframe type
}

export interface Proxy {
  id: string;
  name: string;
  url: string;
}
