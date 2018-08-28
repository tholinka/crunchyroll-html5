export interface IVilosConfig {
  media: IVilosMedia;
  player: IVilosPlayer;
  analytics: IVilosAnalytics;
  metadata: IVilosPlayerMetadata;
  nextMediaUrl?: string;
}

export interface IVilosPlayer {
  language: string;
  start_offset: number;
}

export interface IVilosMedia {
  metadata: IVilosMetadata;
  streams: IVilosStream[];
  subtitles: IVilosSubtitle[];
  thumbnail: IVilosThumbnail;
}

export interface IVilosStream {
  audio_lang: string;
  format: string;
  hardsub_lang?: string;
  resolution: string;
  url: string;
}

export interface IVilosSubtitle {
  format: string;
  language: string;
  title: string;
  url: string;
}

export interface IVilosMetadata {
  channel_id: string;
  description: string;
  display_episode_number: string;
  duration: number;
  episode_number: string;
  id: string;
  title: string;
  type: string;
}

export interface IVilosThumbnail {
  url: string;
}

export interface IVilosPlayerMetadata {
  id: number;
  collection_id: number;
  group_id: number;
  name: string;
  duration: number;
  tags: string[];
}

export interface IVilosAnalytics {
  user_id: string;
  legacy: IVilosLegacy;
  media_reporting_parent: IVilosMediaReporting;
}

export interface IVilosLegacy {
  media_id: string;
  media_type: string;
  url: string;
  video_encode_id: string;
}

export interface IVilosMediaReporting {
  type: string;
  id: string;
  title: string;
}
