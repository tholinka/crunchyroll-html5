import { ISubtitle } from 'crunchyroll-lib/models/ISubtitle';

export class SubtitleToAss {
  private _subtitle: ISubtitle;

  constructor(subtitle: ISubtitle) {
    this._subtitle = subtitle;
  }

  public async getContentAsAss(): Promise<string> {
    const model = await this._subtitle.getContent();

    let output = '[Script Info]\n';
    output += 'Title: ' + model.title + '\n';
    output += 'ScriptType: v4.00+\n';
    output += 'WrapStyle: ' + model.wrapStyle + '\n';
    output += 'PlayResX: ' + model.playResX + '\n';
    output += 'PlayResY: ' + model.playResY + '\n';
    output += '\n';
    output += '[V4+ Styles]\n';
    output +=
      'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n';
    const styles = model.styles;
    for (const style of styles) {
      // Sometimes Crunchyroll sets the scaleX and scaleY to 0, which makes no
      // sense.
      let scaleX = style.scaleX;
      let scaleY = style.scaleY;
      if (scaleX === '0') {
        scaleX = '100';
      }
      if (scaleY === '0') {
        scaleY = '100';
      }

      output += 'Style: ' + style.name;
      output += ', ' + style.fontName;
      output += ', ' + style.fontSize;
      output += ', ' + style.primaryColour;
      output += ', ' + style.secondaryColour;
      output += ', ' + style.outlineColour;
      output += ', ' + style.backColour;
      output += ', ' + style.bold;
      output += ', ' + style.italic;
      output += ', ' + style.underline;
      output += ', ' + style.strikeout;
      output += ', ' + scaleX;
      output += ', ' + scaleY;
      output += ', ' + style.spacing;
      output += ', ' + style.angle;
      output += ', ' + style.borderStyle;
      output += ', ' + style.outline;
      output += ', ' + style.shadow;
      output += ', ' + style.alignment;
      output += ', ' + style.marginL;
      output += ', ' + style.marginR;
      output += ', ' + style.marginV;
      output += ', ' + style.encoding;
      output += '\n';
    }

    output += '\n';
    output += '[Events]\n';
    output +=
      'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';

    const events = model.events;
    for (const event of events) {
      output += 'Dialogue: 0';
      output += ', ' + event.start;
      output += ', ' + event.end;
      output += ', ' + event.style;
      output += ', ' + event.name;
      output += ', ' + event.marginL;
      output += ', ' + event.marginR;
      output += ', ' + event.marginV;
      output += ', ' + event.effect;
      output += ', ' + event.text;
      output += '\n';
    }

    return output;
  }
}
