import { ISubtitle } from 'crunchyroll-lib/models/ISubtitle';

export class SubtitleToAss {
  private _subtitle: ISubtitle;

  constructor(subtitle: ISubtitle) {
    this._subtitle = subtitle;
  }

  async getContentAsAss(): Promise<string> {
    const model = await this._subtitle.getContent();

    let output = '[Script Info]\n';
    output += "Title: " + model.title + "\n";
    output += "ScriptType: v4.00+\n";
    output += "WrapStyle: " + model.wrapStyle + "\n";
    output += "PlayResX: " + model.playResX + "\n";
    output += "PlayResY: " + model.playResY + "\n";
    output += "\n";
    output += "[V4+ Styles]\n";
    output += "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n";
    const styles = model.styles;
    for (let i = 0; i < styles.length; i++) {
      output += "Style: " + styles[i].name;
      output += ", " + styles[i].fontName;
      output += ", " + styles[i].fontSize;
      output += ", " + styles[i].primaryColour;
      output += ", " + styles[i].secondaryColour;
      output += ", " + styles[i].outlineColour;
      output += ", " + styles[i].backColour;
      output += ", " + styles[i].bold;
      output += ", " + styles[i].italic;
      output += ", " + styles[i].underline;
      output += ", " + styles[i].strikeout;
      output += ", " + styles[i].scaleX;
      output += ", " + styles[i].scaleY;
      output += ", " + styles[i].spacing;
      output += ", " + styles[i].angle;
      output += ", " + styles[i].borderStyle;
      output += ", " + styles[i].outline;
      output += ", " + styles[i].shadow;
      output += ", " + styles[i].alignment;
      output += ", " + styles[i].marginL;
      output += ", " + styles[i].marginR;
      output += ", " + styles[i].marginV;
      output += ", " + styles[i].encoding;
      output += "\n";
    }

    output += "\n";
    output += "[Events]\n";
    output += "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n";

    const events = model.events;
    for (let i = 0; i < events.length; i++) {
      output += "Dialogue: 0";
      output += ", " + events[i].start;
      output += ", " + events[i].end;
      output += ", " + events[i].style;
      output += ", " + events[i].name;
      output += ", " + events[i].marginL;
      output += ", " + events[i].marginR;
      output += ", " + events[i].marginV;
      output += ", " + events[i].effect;
      output += ", " + events[i].text;
      output += "\n";
    }

    return output;
  }
}