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
        const parentElement = links[i].parentElement;
        if (parentElement !== null) {
          return NextVideo.fromElement(parentElement);
        }
      }
    }

    return undefined;
  }

  static fromElement(element: Element): NextVideo|undefined {
    const link = element.querySelector("a.link");
    if (!link) return undefined;

    const href = link.getAttribute("href");
    if (!href) return undefined;

    const url = new URL(href, window.location.href);

    const img = element.querySelector("img.mug");
    if (!img || !img.hasAttribute('src')) return undefined;

    let thumbnail: string = img.getAttribute("src")!.replace(/_[a-zA-Z]+(\.[a-zA-Z]+)$/, "_full$1");
    let seriesAndEpisodeNumber: string = img.getAttribute("alt")!;
    let episode: string = element
      .querySelector(".collection-carousel-overlay-top")!.textContent!
      .trim();
    let title: string = element
      .querySelector(".collection-carousel-overlay-bottom")!.textContent!
      .trim();
    let seriesTitle: string = seriesAndEpisodeNumber.substring(0,
      seriesAndEpisodeNumber.length - episode.length);
      
    return new NextVideo(url.toString(), undefined, seriesTitle, episode, title, thumbnail);
  }
}