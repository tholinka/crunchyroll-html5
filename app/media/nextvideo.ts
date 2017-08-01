export class NextVideo {
  constructor(
    public url: string,
    public duration: number,
    public seriesTitle: string,
    public episodeNumber: string,
    public episodeTitle: string,
    public thumbnailUrl: string
  ) {}

  static fromUrlUsingDocument(url: string): NextVideo {
    var links = document.querySelectorAll(".collection-carousel-media-link a");
    for (let i = 0; i < links.length; i++) {
      let href = links[i].getAttribute("href");
      if (url.substring(url.length - href.length) === href) {
        let img = links[i].querySelector("img.mug");
        let thumbnail: string = img.getAttribute("src");
        let seriesAndEpisodeNumber = img.getAttribute("alt");
        let episode: string = links[i]
          .querySelector(".collection-carousel-overlay-top").textContent.trim();
        let title: string = links[i]
          .querySelector(".collection-carousel-overlay-bottom").textContent
          .trim();
        let seriesTitle: string = seriesAndEpisodeNumber.substring(0,
          seriesAndEpisodeNumber.length - episode.length);
        return new NextVideo(url, null, seriesTitle, episode, title, thumbnail);
      }
    }

    return null;
  }
}