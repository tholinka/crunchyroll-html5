import { padLeft, padRight } from './string';

export function parseSeconds(seconds: number): { hours: number, minutes: number, seconds: number } {
  const hours: number = Math.floor(seconds / 3600);
  const minutes: number = Math.floor((seconds - (hours * 3600)) / 60);
  seconds = Math.floor(seconds - hours * 3600 - minutes * 60);

  return {
    hours: hours,
    minutes: minutes,
    seconds: seconds
  }
}

export function parseAndFormatTime(s: number): string {
  const { hours, minutes, seconds } = parseSeconds(s);

  return formatTime(hours, minutes, seconds);
}

export function formatTime(hours: number, minutes: number, seconds: number): string {
  let format: string = "";
  if (hours > 0) {
    format = padLeft(hours, 2) + ":";
  }

  format += padLeft(minutes, hours === 0 ? 1 : 2) + ":" + padLeft(seconds, 2);

  return format;
}