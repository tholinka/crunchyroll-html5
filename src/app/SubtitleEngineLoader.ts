

export let workerUrl: string;
export let files: {[key: string]: { url: string }};

export function setWorkerUrl(url: string) {
  workerUrl = url;
}

export function addFile(filename: string, url: string) {
  files[filename] = { url: url };
}

export function getWorkerUrl() {
  return workerUrl;
}

export function getFiles() {
  return files;
}