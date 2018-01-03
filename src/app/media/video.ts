import * as request from '../utils/xhr';
import * as pako from 'pako';
import * as bigInt from 'big-integer';
import { padLeft, padRight, hexStringToByte } from '../utils/string';
import { TextDecoder, TextEncoder } from 'text-encoding';
import * as aes from 'aes-js';
import { SHA1 } from '../utils/hash/sha1';
import * as parseUrl from 'url-parse';

function assToVtt(text: string): string {
  const defaultReplacements: any = {
    'i': {
      '0': '</i>',
      '1': '<i>'
    },
    'u': {
      '0': '</u>',
      '1': '<u>'
    },
    's': {
      '0': '</s>',
      '1': '<s>'
    }
  };

  return text
    .replace(/{\\([a-zA-Z]+)(\-?[0-9]+)}/g, (m) => {
      const tag = m[1];
      const value = m[2];

      if (defaultReplacements.hasOwnProperty(tag)) {
        return defaultReplacements[tag][value] || "";
      } else if (tag === 'b') {
        if (value === "0") {
          return "</b>"
        } else {
          return "<b>";
        }
      } else {
        return "";
      }
    })
}

function toVttTimeFormat(format: string): string {
  const parts: number[] = format.split(/[:\.]/g)
    .map(n => parseInt(n, 10));

  let output = '';
  for (let i = 0; i < parts.length; i++) {
    if (parts.length - 1 === i) {
      if (i > 0) {
        output += ".";
      }
      output += padRight(parts[i], 3);
    } else {
      if (i > 0) {
        output += ":";
      }
      output += padLeft(parts[i], 2);
    }
  }

  return output;
}

function searchFor(str: string, start: string, end: string): string {
  const startIndex = str.indexOf(start);
  if (startIndex === -1) throw new Error("Start str not inside str.");
  str = str.substring(startIndex + start.length);
  const endIndex = str.indexOf(end);
  if (endIndex === -1) throw new Error("End str not inside str.");

  return str.substring(0, endIndex);
}

function toArray<T>(arrLike: ArrayLike<T>): T[] {
  const arr = [];
  for (let i = 0; i < arrLike.length; i++) {
    arr.push(arrLike[i]);
  }
  return arr;
}

async function decryptSubtitle(iv: string, data: string, id: number): Promise<Uint8Array> {
  const ivBytes: Uint8Array = new Uint8Array(atob(iv).split("").map(function(c) {
    return c.charCodeAt(0);
  }));
  const dataBytes: Uint8Array = new Uint8Array(atob(data).split("").map(function(c) {
    return c.charCodeAt(0);
  }));

  const key: Uint8Array = await obfuscateKey(id);
  const aesCbc = new aes.ModeOfOperation.cbc(key, ivBytes);
  const decryptedData = new Uint8Array(aesCbc.decrypt(dataBytes));

  return pako.inflate(decryptedData);
}

function obfuscateKeyAux(count: number, modulo: number, start: number[]) {
  let output: number[] = start.slice(0);
  for (let i = 0; i < count; i++) {
    output.push(output[output.length - 1] + output[output.length - 2]);
  }
  output = output.slice(2);
  return output.map(x => x % modulo + 33);
}

function obfuscateKey(n: number): Uint8Array {
  const key = bigInt(n);
  const num1 = bigInt(Math.floor(Math.pow(2, 25) * Math.sqrt(6.9)));
  const num2 = num1.xor(key).shiftLeft(5);
  const num3 = key.xor(num1);
  const num4 = num3.xor(num3.shiftRight(3)).xor(num2);

  const keyAux = new Uint8Array(obfuscateKeyAux(20, 97, [1, 2]));
  const num4Arr = new TextEncoder("ascii").encode(num4.toString());
  const shaData = new Uint8Array(keyAux.length + num4Arr.length);
  shaData.set(keyAux);
  shaData.set(num4Arr, keyAux.length);

  const sha1 = new SHA1();
  sha1.update(shaData);

  const shaHash = hexStringToByte(sha1.digest());

  const emptyArray = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const result = new Uint8Array(shaHash.length + emptyArray.length);
  result.set(shaHash);
  result.set(emptyArray, shaHash.length);

  return result;
}

const FORMAT_IDS: any = {
  '360p': [ '60', '106' ],
  '480p': [ '61', '106' ],
  '720p': [ '62', '106' ],
  '1080p': [ '80', '108' ],
};

export class Stream {
  constructor(
    public url: string,
    public width: number,
    public height: number,
    public duration: number,
    public subtitles: Subtitle[],
    public mediaId: string,
    public mediaType: string,
    public encodeId: string,
    public thumbnailUrl: string,
    public episodeNumber: string,
    public episodeTitle: string,
    public seriesTitle: string,
    public nextUrl: string,
    public pingBackIntervals: number[],
    public startTime: number
  ) {}

  private static async _init(url: string, allowRedirect: boolean = true): Promise<Stream> {
    const response = await request.get(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      background: location.protocol === 'https:'
    });
    const doc = (new DOMParser()).parseFromString(response, "text/xml");
    const streamInfo = doc.querySelector("stream_info");
    if (!streamInfo) {
      const m = response.match(/document\.location\.href=(.*?);/);
      if (!m || !allowRedirect)
        throw new Error("Tag stream_info not found.");
      return await Stream._init(JSON.parse(m[1]), false);
    }
    const mediaId: string = streamInfo.querySelector("media_id")!.textContent!;
    const mediaType: string = streamInfo.querySelector("media_type")!.textContent!;
    const encodeId: string = streamInfo.querySelector("video_encode_id")!.textContent!;
    const file: string = streamInfo.querySelector("file")!.textContent!;

    const width: number = parseInt(streamInfo.querySelector("metadata width")!.textContent!, 10);
    const height: number = parseInt(streamInfo.querySelector("metadata height")!.textContent!, 10);
    const duration: number = parseFloat(streamInfo.querySelector("metadata duration")!.textContent!);
    const startTimeElement: Element|null = doc.querySelector("startTime");
    let startTime: number = 0;
    if (startTimeElement) {
      startTime = parseFloat(startTimeElement.textContent!);
    }

    const thumbnailUrl: string = doc.querySelector("media_metadata episode_image_url")!.textContent!;
    const nextUrl: string = doc.querySelector("nextUrl")!.textContent!;

    const episodeTitle: string = doc.querySelector("episode_title")!.textContent!;
    const episodeNumber: string = doc.querySelector("episode_number")!.textContent!;
    const seriesTitle: string = doc.querySelector("series_title")!.textContent!;

    const subtitles: Subtitle[] = [];
    const subtitleElements = doc.querySelectorAll("subtitles subtitle");
    for (let i = 0; i < subtitleElements.length; i++) {
      let id = subtitleElements[i].getAttribute("id") || "";
      let url = subtitleElements[i].getAttribute("link");
      if (!url) continue;
      let title = subtitleElements[i].getAttribute("title") || "";
      let isDefault = subtitleElements[i].getAttribute("default") === "1";
      let delay = parseFloat(subtitleElements[i].getAttribute("delay") || "0");

      let subtitle = new Subtitle(id, title, delay, isDefault, url);

      const preloadSubtitle = doc.querySelector("preload > subtitle");
      if (preloadSubtitle && preloadSubtitle.getAttribute("id") === id) {
        const iv = preloadSubtitle.querySelector("iv")!.textContent!;
        const data = preloadSubtitle.querySelector("data")!.textContent!;
        let contentBytes = await decryptSubtitle(iv, data, parseInt(id));
        let content = new TextDecoder("utf-8").decode(contentBytes);
        let xml = (new DOMParser()).parseFromString(content, "text/xml");
  
        subtitle.setContent(new SubtitleContent(xml));
      }

      subtitles.push(subtitle);
    }

    let pingBackIntervals: number[];
    const pingBackIntervalsElement = doc.querySelector("pingBackIntervals");
    if (pingBackIntervalsElement && pingBackIntervalsElement.textContent) {
      pingBackIntervals = pingBackIntervalsElement.textContent
        .split(" ").map(value => parseInt(value, 10));
    } else {
      pingBackIntervals = [30000];
    }

    return new Stream(file, width, height, duration, subtitles, mediaId,
      mediaType, encodeId, thumbnailUrl, episodeNumber, episodeTitle,
      seriesTitle, nextUrl, pingBackIntervals, startTime);
  }

  static async fromCurrentPage(currentPage: string, mediaId: string, streamFormat: string, streamQuality: string): Promise<Stream> {
    const streamUrl = location.protocol + "//www.crunchyroll.com/xml/?req=RpcApiVideoPlayer_GetStandardConfig"
        + "&media_id=" + encodeURIComponent(mediaId)
        + "&video_format=" + encodeURIComponent(streamFormat)
        + "&video_quality=" + encodeURIComponent(streamQuality)
        + "&current_page=" + encodeURIComponent(currentPage);
    return await Stream._init(streamUrl);
  }

  static async fromAffiliate(currentPage: string, affiliateId: string, mediaId: string, streamFormat: string, streamQuality: string, autoPlay: boolean): Promise<Stream> {
    const streamUrl = location.protocol + "//www.crunchyroll.com/xml/?req=RpcApiVideoPlayer_GetStandardConfig"
        + "&media_id=" + encodeURIComponent(mediaId)
        + "&video_format=" + encodeURIComponent(streamFormat)
        + "&video_quality=" + encodeURIComponent(streamQuality)
        + "&aff=" + encodeURIComponent(affiliateId)
        + "&current_page=" + encodeURIComponent(currentPage)
        + "&auto_play=" + (autoPlay ? "1" : "0");
    return await Stream._init(streamUrl);
  }
}

export class Subtitle {
  private _content: SubtitleContent|undefined = undefined;

  constructor(
    public id: string,
    public title: string,
    public delay: number,
    public isDefault: boolean,
    public url: string
  ) {}

  setContent(content: SubtitleContent): void {
    this._content = content;
  }

  async getContent(): Promise<SubtitleContent> {
    if (this._content) {
      return this._content;
    } else {
      let subResponse = await request.get(this.url, {
        background: location.protocol === 'https:'
      });
      let subDoc = (new DOMParser()).parseFromString(subResponse, "text/xml");
      let id = subDoc.querySelector("subtitle")!.getAttribute("id")!;
      let iv = subDoc.querySelector("iv")!.textContent!;
      let data = subDoc.querySelector("data")!.textContent!;

      let contentBytes = await decryptSubtitle(iv, data, parseInt(id));
      let content = new TextDecoder("utf-8").decode(contentBytes);
      let xml = (new DOMParser()).parseFromString(content, "text/xml");

      this._content = new SubtitleContent(xml);

      return this._content;
    }
  }
}

export class SubtitleContent {
  constructor(
    private xml: Document
  ) {}

  get title(): string {
    return this.xml.querySelector("subtitle_script")!.getAttribute("title")!;
  }

  get langCode(): string {
    let code = this.xml.querySelector("subtitle_script")!.getAttribute("lang_code")!;
    const m = code.match(/^([a-z]+)([A-Z]+)$/);
    if (m) {
      code = m[1] + "-" + m[2];
    }

    return code;
  }

  get langString(): string {
    return this.xml.querySelector("subtitle_script")!.getAttribute("lang_string")!;
  }

  toAss(): string {
    const getAttr = (name: string): string => this.xml.querySelector("subtitle_script")!.getAttribute(name)!;
    const assBool = (bool: string): string => bool === '1' ? '-1' : '0';

    let output = '[Script Info]\n';
    output += "Title: " + getAttr("title") + "\n";
    output += "ScriptType: v4.00+\n";
    output += "WrapStyle: " + getAttr("wrap_style") + "\n";
    output += "PlayResX: " + getAttr("play_res_x") + "\n";
    output += "PlayResY: " + getAttr("play_res_y") + "\n";
    output += "\n";
    output += "[V4+ Styles]\n";
    output += "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n";
    let styles = this.xml.querySelectorAll("styles style");
    for (let i = 0; i < styles.length; i++) {
      output += "Style: " + styles[i].getAttribute("name");
      output += ", " + styles[i].getAttribute("font_name");
      output += ", " + styles[i].getAttribute("font_size");
      output += ", " + styles[i].getAttribute("primary_colour");
      output += ", " + styles[i].getAttribute("secondary_colour");
      output += ", " + styles[i].getAttribute("outline_colour");
      output += ", " + styles[i].getAttribute("back_colour");
      output += ", " + assBool(styles[i].getAttribute("bold")!);
      output += ", " + assBool(styles[i].getAttribute("italic")!);
      output += ", " + assBool(styles[i].getAttribute("underline")!);
      output += ", " + assBool(styles[i].getAttribute("strikeout")!);
      output += ", " + styles[i].getAttribute("scale_x");
      output += ", " + styles[i].getAttribute("scale_y");
      output += ", " + styles[i].getAttribute("spacing");
      output += ", " + styles[i].getAttribute("angle");
      output += ", " + styles[i].getAttribute("border_style");
      output += ", " + styles[i].getAttribute("outline");
      output += ", " + styles[i].getAttribute("shadow");
      output += ", " + styles[i].getAttribute("alignment");
      output += ", " + styles[i].getAttribute("margin_l");
      output += ", " + styles[i].getAttribute("margin_r");
      output += ", " + styles[i].getAttribute("margin_v");
      output += ", " + styles[i].getAttribute("encoding");
      output += "\n";
    }

    output += "\n";
    output += "[Events]\n";
    output += "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";

    var events = this.xml.querySelectorAll("events event");
    for (let i = 0; i < events.length; i++) {
      output += "Dialogue: 0";
      output += ", " + events[i].getAttribute("start");
      output += ", " + events[i].getAttribute("end");
      output += ", " + events[i].getAttribute("style");
      output += ", " + events[i].getAttribute("name");
      output += ", " + events[i].getAttribute("margin_l");
      output += ", " + events[i].getAttribute("margin_r");
      output += ", " + events[i].getAttribute("margin_v");
      output += ", " + events[i].getAttribute("effect");
      output += ", " + events[i].getAttribute("text");
      output += "\n";
    }

    return output;
  }

  toVtt(): string {
    var output = 'WEBVTT FILE\n\n';
    var events = this.xml.querySelectorAll("events event");
    for (let i = 0; i < events.length; i++) {
      let start = events[i].getAttribute("start")!;
      let end = events[i].getAttribute("end")!;

      start = toVttTimeFormat(start);
      end = toVttTimeFormat(end);

      let text = events[i].getAttribute("text")!.replace(/(\\N)+/g, '\n').trim();
      if (i > 0) output += "\n\n";
      output += (i + 1) + "\n"
        + start + " --> " + end + "\n"
        + assToVtt(text);
    }

    return output;
  }

  toSrt(): string {
    let output = '';
    const events = this.xml.querySelectorAll("events event");
    for (let i = 0; i < events.length; i++) {
      let start = events[i].getAttribute("start")!.replace(/\./g, ",");
      let end = events[i].getAttribute("end")!.replace(/\./g, ",");
      let text = events[i].getAttribute("text")!.replace(/\\N/g, '\n');
      output += (i + 1) + "\n" + start + " --> " + end + "\n" + text + "\n\n";
    }

    return output;
  }
}

export interface IMediaDocument {
  getTitle(): string;
  getDescription(): string;
  getMediaId(): string;
  getMediaFormats(): IMediaFormat[];
  getDefaultMediaFormat(): IMediaFormat|undefined;
  getStartTime(): number;
  isAutoPlay(): boolean;
}

export interface IMediaFormat {
  default: boolean;
  format: string;
  quality: string;

  getStream(): Promise<Stream>;
}

interface IAffiliateQuery {
  aff?: string;
  media_id?: string;
  video_format?: string;
  video_quality?: string;
  auto_play?: string;
  t?: string;
}

export class AffiliateMediaFormat implements IMediaFormat {
  private _currentUrl: string;
  private _affiliateId: string;
  private _mediaId: string;
  private _autoPlay: boolean;

  public default: boolean;
  public format: string;
  public quality: string;

  constructor(currentUrl: string, affiliateId: string, mediaId: string, format: string, quality: string, def: boolean, autoPlay: boolean) {
    this._currentUrl = currentUrl;
    this._affiliateId = affiliateId;
    this._mediaId = mediaId;
    this._autoPlay = autoPlay;

    this.format = format;
    this.quality = quality;
    this.default = def;
  }

  async getStream(): Promise<Stream> {
    return await Stream.fromAffiliate(this._currentUrl, this._affiliateId, this._mediaId, this.format, this.quality, this._autoPlay);
  }
}

export class AffiliateMediaDocument implements IMediaDocument {
  private _mediaId: string;
  private _formats: IMediaFormat[];

  private _startTime: number;
  private _autoPlay: boolean;

  constructor(url: string) {
    const fragments = AffiliateMediaDocument.parseUrlFragments(url);
    if (!fragments) throw new Error("Unable to parse URL");

    this._mediaId = fragments.mediaId;
    this._autoPlay = fragments.autoPlay;
    this._formats = [
      new AffiliateMediaFormat(
        url,
        fragments.affiliateId,
        fragments.mediaId,
        fragments.videoFormat,
        fragments.videoQuality,
        true,
        fragments.autoPlay
      )
    ];
  }

  getStartTime(): number {
    return this._startTime;
  }

  isAutoPlay(): boolean {
    return this._autoPlay;
  }

  getTitle(): string {
    return "";
  }

  getDescription(): string {
    return "";
  }

  getMediaId(): string {
    return this._mediaId;
  }

  getMediaFormats(): IMediaFormat[] {
    return this._formats;
  }

  getDefaultMediaFormat(): IMediaFormat|undefined {
    const formats = this.getMediaFormats();
    for (let i = 0; i < formats.length; i++) {
      if (formats[i].default) {
        return formats[i];
      }
    }
    return undefined;
  }

  static parseUrlFragments(url: string) {
    // https://www.crunchyroll.com/boruto-naruto-next-generations/episode-17-run-sarada-740239
    const re = /^https?:\/\/(?:(?:www|m)\.)?(?:crunchyroll\.(?:com|fr))\/affiliate_iframeplayer\?/g;
    const m = re.exec(url);
    if (!m) return undefined;

    const query = parseUrl(url, true).query as IAffiliateQuery;

    if (typeof query.aff !== "string") throw new Error("`aff` not in query");
    if (typeof query.media_id !== "string") throw new Error("`media_id` not in query");
    if (typeof query.video_format !== "string") throw new Error("`video_format` not in query");
    if (typeof query.video_quality !== "string") throw new Error("`video_quality` not in query");

    return {
      affiliateId: query.aff,
      mediaId: query.media_id,
      videoFormat: query.video_format,
      videoQuality: query.video_quality,
      autoPlay: query.auto_play === "1",
      startTime: parseFloat(query.t || '-1')
    };
  }
}

export class MediaFormat implements IMediaFormat {
  private _currentUrl: string;
  private _mediaId: string;

  public default: boolean;
  public format: string;
  public quality: string;

  constructor(currentUrl: string, mediaId: string, format: string, quality: string, def: boolean) {
    this._currentUrl = currentUrl;
    this._mediaId = mediaId;

    this.format = format;
    this.quality = quality;
    this.default = def;
  }

  async getStream(): Promise<Stream> {
    return await Stream.fromCurrentPage(this._currentUrl, this._mediaId, this.format, this.quality)
  }
}

interface IMediaDocumentQuery {
  t?: string;
  auto_play?: string;
}

export class MediaDocument implements IMediaDocument {
  private _mediaId: string;
  private _title: string;
  private _description: string;

  private _autoPlay: boolean;
  private _startTime: number;

  private _formats: IMediaFormat[] = [];

  constructor(url: string, doc: Document) {
    const fragments = MediaDocument.parseUrlFragments(url);
    if (!fragments) throw new Error("Unable to parse URL");

    this._mediaId = fragments.mediaId;
    
    if (doc.documentElement.innerText.indexOf("To view this, please log in to verify you are 18 or older.") !== -1)
      throw new Error("User is required to log in.");
    
    this._title = doc.querySelector("h1[itemscope] a span[itemprop=title]")!
      .parentNode!.parentNode!.textContent!
      .replace(/[\s]+/g, " ")
      .trim();
    
    this._description = toArray(doc.querySelector(".description")!.childNodes)
      .filter(node => {
        return node.nodeType === Node.TEXT_NODE;
      })
      .map(node => {
        return node.textContent;
      })
      .join('')
      .trim();
    const query = parseUrl(url, true).query as IMediaDocumentQuery;
    if (typeof query.t === 'string') {
      this._startTime = parseFloat(query.t);
    } else {
      this._startTime = -1;
    }
    if (typeof query.auto_play === 'string') {
      this._autoPlay = query.auto_play === "1";
    } else {
      this._autoPlay = true;
    }
    const fmtElements = doc.querySelectorAll("a[token^=showmedia\\.]");
    for (let i = 0; i < fmtElements.length; i++) {
      if (fmtElements[i].getAttribute("href")!.indexOf("/freetrial") === 0)
        continue;
      const token = fmtElements[i].getAttribute("token")!.substring(10);
      const [ streamQuality, streamFormat ] = FORMAT_IDS[token];

      this._formats.push(
        new MediaFormat(
          url,
          fragments.mediaId,
          streamFormat,
          streamQuality,
          fmtElements[i].classList.contains('dark-button')
        )
      );
    }
  }

  static async fromUrl(url: string): Promise<MediaDocument> {
    const fragments = MediaDocument.parseUrlFragments(url);
    if (!fragments) throw new Error("Unable to parse URL");

    let { prefix, webpageUrl } = fragments;

    if (prefix === 'm') {
      const mobileResponse: string = await request.get(url, {
        background: location.protocol === 'https:'
      });
      webpageUrl = searchFor(mobileResponse, "<link rel=\"canonical\" href=\"", "\" />");
    } else {
      webpageUrl = location.protocol + '//www.' + webpageUrl;
    }

    const response = await request.get(webpageUrl, {
      background: location.protocol === 'https:'
    });
    const doc = (new DOMParser()).parseFromString(response, "text/html");

    return new MediaDocument(webpageUrl, doc);
  }

  isAutoPlay(): boolean {
    return this._autoPlay;
  }

  getStartTime(): number {
    return this._startTime;
  }

  getTitle(): string {
    return this._title;
  }

  getDescription(): string {
    return this._description;
  }

  getMediaId(): string {
    return this._mediaId;
  }

  getMediaFormats(): IMediaFormat[] {
    return this._formats;
  }

  getDefaultMediaFormat(): IMediaFormat|undefined {
    const formats = this.getMediaFormats();
    for (let i = 0; i < formats.length; i++) {
      if (formats[i].default) {
        return formats[i];
      }
    }
    return undefined;
  }

  static parseUrlFragments(url: string) {
    // https://www.crunchyroll.com/boruto-naruto-next-generations/episode-17-run-sarada-740239
    const re = /https?:\/\/(?:(www|m)\.)?(crunchyroll\.(?:com|fr)\/(?:media(?:-|\/\?id=)|[^/]*\/[^/?&]*?)([0-9]+))(?:[/?&]|$)/g;
    const m = re.exec(url);
    if (!m) return undefined;

    const prefix: string = m[1];
    const webpageUrl: string = m[2];
    const mediaId: string = m[3];

    return {
      prefix: prefix,
      webpageUrl: webpageUrl,
      mediaId: mediaId
    };
  }
}