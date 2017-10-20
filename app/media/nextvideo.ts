export class NextVideo {
  constructor(
    public url: string,
    public duration: number|undefined,
    public seriesTitle: string,
    public episodeNumber: string,
    public episodeTitle: string,
    public thumbnailUrl: string
  ) {}

  static fromUrlUsingDocument(url: string): NextVideo|undefined {
    const links = document.querySelectorAll(".collection-carousel-media-link a");
    for (let i = 0; i < links.length; i++) {
      const href = links[i].getAttribute("href");
      if (!href) continue;
      if (url.substring(url.length - href.length) === href) {
        const img = links[i].querySelector("img.mug");
        if (!img) continue;
        let thumbnail: string = img.getAttribute("src")!;
        let seriesAndEpisodeNumber: string = img.getAttribute("alt")!;
        let episode: string = links[i]
          .querySelector(".collection-carousel-overlay-top")!.textContent!
          .trim();
        let title: string = links[i]
          .querySelector(".collection-carousel-overlay-bottom")!.textContent!
          .trim();
        let seriesTitle: string = seriesAndEpisodeNumber.substring(0,
          seriesAndEpisodeNumber.length - episode.length);
        return new NextVideo(url, undefined, seriesTitle, episode, title, thumbnail);
      }
    }

    return undefined;
  }
}