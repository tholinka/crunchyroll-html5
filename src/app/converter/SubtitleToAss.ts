import { ISubtitle } from 'crunchyroll-lib/models/ISubtitle';
import { DOMParser } from 'crunchyroll-lib/services/xml/DOMParser';
import { Document } from 'crunchyroll-lib/services/xml/Document';
import { Element } from 'crunchyroll-lib/services/xml/Element';

class BaseXMLModel {
  protected _element: Element;

  constructor(element: Element) {
    this._element = element;
  }
  
  protected _getElement(tagName: string): Element {
    const children = this._element.children;
    for (let i = 0; i < children.length; i++) {
      if (children[i].tagName === tagName) {
        return children[i];
      }
    }
    throw new Error("Element " + tagName + " not found.");
  }
}

class SubtitleXMLModel extends BaseXMLModel {
  get title(): string {
    return this._element.getAttribute("title");
  }

  get wrapStyle(): string {
    return this._element.getAttribute("wrap_style");
  }

  get playResX(): string {
    return this._element.getAttribute("play_res_x");
  }

  get playResY(): string {
    return this._element.getAttribute("play_res_y");
  }

  get styles(): SubtitleStyleXMLModel[] {
    return this._getElement("styles")
      .getElementsByTagName("style")
      .map(x => new SubtitleStyleXMLModel(x));
  }

  get events(): SubtitleEventXMLModel[] {
    return this._getElement("events")
      .getElementsByTagName("event")
      .map(x => new SubtitleEventXMLModel(x));
  }
}

class SubtitleStyleXMLModel extends BaseXMLModel {
  get name(): string {
    return this._element.getAttribute("name");
  }

  get fontName(): string {
    return this._element.getAttribute("font_name");
  }

  get fontSize(): string {
    return this._element.getAttribute("font_size");
  }

  get primaryColour(): string {
    return this._element.getAttribute("primary_colour");
  }

  get secondaryColour(): string {
    return this._element.getAttribute("secondary_colour");
  }

  get outlineColour(): string {
    return this._element.getAttribute("outline_colour");
  }

  get backColour(): string {
    return this._element.getAttribute("back_colour");
  }

  get bold(): string {
    return this._element.getAttribute("bold") === '1' ? '-1' : '0';
  }

  get italic(): string {
    return this._element.getAttribute("italic") === '1' ? '-1' : '0';
  }

  get underline(): string {
    return this._element.getAttribute("underline") === '1' ? '-1' : '0';
  }

  get strikeout(): string {
    return this._element.getAttribute("strikeout") === '1' ? '-1' : '0';
  }

  get scaleX(): string {
    return this._element.getAttribute("scale_x");
  }

  get scaleY(): string {
    return this._element.getAttribute("scale_y");
  }

  get spacing(): string {
    return this._element.getAttribute("spacing");
  }

  get angle(): string {
    return this._element.getAttribute("angle");
  }

  get borderStyle(): string {
    return this._element.getAttribute("border_style");
  }

  get outline(): string {
    return this._element.getAttribute("outline");
  }

  get shadow(): string {
    return this._element.getAttribute("shadow");
  }

  get alignment(): string {
    return this._element.getAttribute("alignment");
  }

  get marginL(): string {
    return this._element.getAttribute("marginL");
  }

  get marginR(): string {
    return this._element.getAttribute("margin_r");
  }

  get marginV(): string {
    return this._element.getAttribute("margin_v");
  }

  get encoding(): string {
    return this._element.getAttribute("encoding");
  }
}

class SubtitleEventXMLModel extends BaseXMLModel {
  get start(): string {
    return this._element.getAttribute("start");
  }

  get end(): string {
    return this._element.getAttribute("end");
  }

  get style(): string {
    return this._element.getAttribute("style");
  }

  get name(): string {
    return this._element.getAttribute("name");
  }

  get marginL(): string {
    return this._element.getAttribute("margin_l");
  }

  get marginR(): string {
    return this._element.getAttribute("margin_r");
  }

  get marginV(): string {
    return this._element.getAttribute("margin_v");
  }

  get effect(): string {
    return this._element.getAttribute("effect");
  }

  get text(): string {
    return this._element.getAttribute("text");
  }
}

export class SubtitleToAss {
  private _subtitle: ISubtitle;

  constructor(subtitle: ISubtitle) {
    this._subtitle = subtitle;
  }

  async getContentAsAss(): Promise<string> {
    const content = await this._subtitle.getContentAsString();
    const document = await (new DOMParser()).parseFromString(content);

    const subtitleScript = document.getFirstElement();
    if (!subtitleScript) throw new Error("No content in XML");

    const model = new SubtitleXMLModel(subtitleScript);

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