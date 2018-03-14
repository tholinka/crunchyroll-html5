import { IHttpClient } from "crunchyroll-lib/models/http/IHttpClient";
import { ContainerConstructor } from "crunchyroll-lib/utils/container";
import container from 'crunchyroll-lib/config';

// Set default HttpClient
let crossHttpClient = container.getConstructor<IHttpClient>("IHttpClient");

export function setCrossHttpClient(httpClient: ContainerConstructor<IHttpClient>): void {
  crossHttpClient = httpClient;
}

export function bindCrossHttpClientAsDefault(): void {
  container.bind("IHttpClient", crossHttpClient);
}