import { getMediaId } from '../player/StandardPlayer';

export interface ICollectionCarouselDetail {
  groupId: number;
  mediaId: string;
  index: number;
}

export function getCollectionCarouselDetail(
  url: string
): ICollectionCarouselDetail {
  const mediaId = getMediaId(url);
  if (mediaId === undefined) throw new Error('URL is not a valid media URL');

  const group = document.querySelector('.collection-carousel');
  if (!group) throw new Error('Collection carousel not found');

  const groupId = parseInt(group.id.substring('carousel-group-'.length), 10);

  const medias = group.querySelectorAll('.collection-carousel-media[media_id]');
  for (let i = 0; i < medias.length; i++) {
    const media = medias[i];
    if (mediaId.toString() === media.getAttribute('media_id')) {
      return {
        mediaId,
        groupId,
        index: i
      };
    }
  }
  throw new Error('Unable to find media in carousel');
}

export interface IMediaMetadata {
  id: number;
  collection_id: number;
  group_id: number;
  name: string;
  duration: number;
  tags: string[];
}

export function getMediaMetadataFromDOM(): IMediaMetadata | undefined {
  const scripts = Array.from(document.querySelectorAll('script'));
  for (const script of scripts) {
    const content = script.textContent;
    if (!content) continue;
    const match = content.match(/mediaMetadata[\s]*=[\s]*({.*});/);
    if (!match || !match[1]) continue;

    return JSON.parse(match[1]) as IMediaMetadata;
  }
  return undefined;
}
