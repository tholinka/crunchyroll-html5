declare namespace browser {
  type ListenerType<T> = (detail: T) => void;
  type MessageListenerType = (
    message: any,
    sender: runtime.MessageSender,
    sendResponse: (message: any) => void
  ) => void|boolean|Promise<any>;
  type onInstalledResponse = {
    id: string|undefined;
    previousVersion: string|undefined;
    reason: runtime.OnInstalledReason;
    temporary: boolean;
  };
  
  interface IListener<T> {
    addListener(listener: ListenerType<T>): void;
    removeListener(listener: ListenerType<T>): void;
    hasListener(listener: ListenerType<T>): boolean;
  }
  
  interface IMessageListener {
    addListener(listener: MessageListenerType): void;
    removeListener(listener: MessageListenerType): void;
    hasListener(listener: MessageListenerType): boolean;
  }

  namespace extension {
		function getURL(path: string): string;
	}

	namespace tabs {
		const TAB_ID_NONE: number;

		class Tab {
			active: boolean;
			audible: boolean|undefined;
			autoDiscardable: boolean|undefined;
			cookieStoreId: string|undefined;
			discarded: boolean|undefined;
			favIconUrl: string|undefined;
			height: number|undefined;
			highlighted: boolean;
			id: number|undefined;
			incognito: boolean;
			index: number;
			lastAccessed: number;
			mutedInfo: browser.tabs.MutedInfo|undefined;
			openerTabId: number|undefined;
			pinned: boolean;
			selected: boolean;
			sessionId: string|undefined;
			status: string|undefined;
			title: string|undefined;
			url: string|undefined;
			width: number|undefined;
			windowId: number;
		}

		class MutedInfo {
			extensionId: string|undefined;
			muted: boolean;
			reason: browser.tabs.MutedInfoReason|undefined;
		}

		type MutedInfoReason = "capture"|"extension"|"user";
	}

	namespace runtime {
		const id: string;
		const lastError: Error|null;
		const onConnect: IListener<browser.runtime.Port>;
		const onStartup: IListener<void>;
		const onInstalled: IListener<onInstalledResponse>;
		const onSuspend: IListener<void>;
		const onSuspendCanceled: IListener<void>;
		const onUpdateAvailable: IListener<{ version: string; }>;
		const onBrowserUpdateAvailable: IListener<void>;
		const onMessage: IMessageListener;

		type OnInstalledReason = "install"|"update"|"browser_update"|"shared_module_update";

		function getBackgroundPage(): Promise<Window>;
		function openOptionsPage(): Promise<void>;
		function getManifest(): Object;
		function getURL(path: string): string;
		function setUninstallURL(url: string): Promise<void>;
		function reload(): void;
		
		type MessageOptionsType = {
			includeTlsChannelId?: boolean,
			toProxyScript?: boolean
		};

		function sendMessage(extensionId: string, message: any, options: MessageOptionsType): Promise<any|undefined>;
		function sendMessage(message: any, options: MessageOptionsType): Promise<any|undefined>;
		function sendMessage(message: any): Promise<any|undefined>;

		class Port {
			name: string;
			error: any;
			onDisconnect: IListener<void>;
			onMessage: IMessageListener;
			sender: browser.runtime.MessageSender|undefined;

			disconnect(): void;
			postMessage(message: any): void;
		}

		class MessageSender {
			tab: browser.tabs.Tab|undefined;
			frameId: number|undefined;
			id: string|undefined;
			url: string|undefined;
			tlsChannelId: string|undefined;
		}
	}
}