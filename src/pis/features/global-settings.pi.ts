import {isErrorOutput, SocketState} from "../../api-server";
import {YTMDPi} from "../../ytmd-pi";
import {PluginData} from "../../shared/plugin-data";
import {GlobalSettingsInterface} from "../../interfaces/global-settings.interface";
import {getCompanionConnector} from "../services/companion-singleton";

export class GlobalSettingsPi {
    private authToken: string = '';
    private settingsLoaded = false;
    private static socketListenersAttached = false;
    private static lastSettingsKey = '';

    constructor(private pi: YTMDPi) {
        this.pi.globalAuthButtonElement.onclick = () => this.startAuthorization();
        this.pi.globalSaveElement.onclick = () => this.saveSettings();
        this.pi.globalHostElement.addEventListener('change', () => this.saveSettingsIfLoaded());
        this.pi.globalPortElement.addEventListener('change', () => this.saveSettingsIfLoaded());
        this.pi.globalHostElement.addEventListener('blur', () => this.saveSettingsIfLoaded());
        this.pi.globalPortElement.addEventListener('blur', () => this.saveSettingsIfLoaded());
        this.pi.requestGlobalSettings();
    }

    public newGlobalSettingsReceived(): void {
        let settings = this.pi.settingsManager.getGlobalSettings<GlobalSettingsInterface>() as GlobalSettingsInterface;
        if (Object.keys(settings).length < 2)
            settings = {host: PluginData.DEFAULT_HOST, port: String(PluginData.DEFAULT_PORT), token: ''};

        const host = PluginData.normalizeHost(settings.host);
        const port = String(PluginData.parsePort(settings.port));
        const token = settings.token ?? '';

        if (document.activeElement !== this.pi.globalHostElement) {
            this.pi.globalHostElement.value = host;
        }
        if (document.activeElement !== this.pi.globalPortElement) {
            this.pi.globalPortElement.value = port;
        }
        this.authToken = token;
        this.settingsLoaded = true;

        this.setAuthStatusMessage(
            token ? this.pi.getLangString("AUTH_STATUS_CONNECTED") : this.pi.getLangString("AUTH_STATUS_NOT_CONNECTED"),
            token ? 'green' : 'red'
        );
        this.ensureSocketClient(host, port, token);
        this.refreshConnectionStatus();
    }

    private async refreshConnectionStatus() {
        const settings = this.pi.settingsManager.getGlobalSettings<GlobalSettingsInterface>() as GlobalSettingsInterface;
        if (!settings?.token) {
            this.setConnectionStatus(
                this.pi.getLangString("CONNECTION_STATUS_AUTH_REQUIRED"),
                'red'
            );
            return;
        }

        this.ensureSocketClient(settings.host, settings.port, settings.token);
    }

    private setAuthStatusMessage(text: string, color: string) {
        this.pi.globalAuthStatusElement.innerText = text;
        this.pi.globalAuthStatusElement.style.color = color;
    }

    private setConnectionStatus(text: string, color: string) {
        this.pi.globalConnectionStatusElement.innerText = text;
        this.pi.globalConnectionStatusElement.style.color = color;
    }

    private getRetrySeconds(message?: string) {
        if (!message) return 5;
        const match = message.match(/retry in (\\d+) seconds?/i);
        if (!match) return 5;
        const seconds = parseInt(match[1], 10);
        if (Number.isNaN(seconds)) return 5;
        return seconds;
    }

    private ensureSocketClient(host: string, port: string, token: string) {
        const normalizedHost = PluginData.normalizeHost(host);
        const normalizedPort = PluginData.parsePort(port);
        const settingsKey = `${normalizedHost}:${normalizedPort}:${token ?? ''}`;
        const connector = getCompanionConnector();
        if (GlobalSettingsPi.lastSettingsKey !== settingsKey) {
            connector.settings = {
                appId: PluginData.APP_ID,
                appName: PluginData.APP_NAME,
                appVersion: PluginData.APP_VERSION,
                host: normalizedHost,
                port: normalizedPort,
                token
            };
        }
        GlobalSettingsPi.lastSettingsKey = settingsKey;

        if (!GlobalSettingsPi.socketListenersAttached) {
            GlobalSettingsPi.socketListenersAttached = true;
            connector.socketClient.addConnectionStateListener((state: SocketState) => {
                switch (state) {
                    case SocketState.CONNECTING:
                        this.setConnectionStatus(this.pi.getLangString("CONNECTION_STATUS_CHECKING"), 'gray');
                        break;
                    case SocketState.CONNECTED:
                        this.setConnectionStatus(this.pi.getLangString("CONNECTION_STATUS_CONNECTED"), 'green');
                        break;
                    case SocketState.DISCONNECTED:
                        this.setConnectionStatus(this.pi.getLangString("CONNECTION_STATUS_DISCONNECTED"), 'red');
                        break;
                    case SocketState.ERROR:
                        this.setConnectionStatus(this.pi.getLangString("CONNECTION_STATUS_DISCONNECTED"), 'red');
                        break;
                    default:
                        break;
                }
            });
            connector.socketClient.addErrorListener((error: any) => {
                this.pi.logMessage(`Connection status check failed: ${JSON.stringify(error)}`);
                if (isErrorOutput(error) && error.statusCode === 429) {
                    const seconds = this.getRetrySeconds(error.message);
                    this.setConnectionStatus(this.pi.getLangString("CONNECTION_STATUS_RATE_LIMIT", {seconds}), 'orange');
                    return;
                }
                if (error instanceof Error && error.message === 'websocket error') {
                    this.setConnectionStatus(this.pi.getLangString("CONNECTION_STATUS_DISCONNECTED"), 'red');
                    return;
                }
                this.setConnectionStatus(this.pi.getLangString("CONNECTION_STATUS_DISCONNECTED"), 'red');
            });
        }

        if (token) {
            connector.socketClient.connect();
        } else {
            this.setConnectionStatus(this.pi.getLangString("CONNECTION_STATUS_AUTH_REQUIRED"), 'red');
        }
    }

    private async startAuthorization() {
        if (this.pi.globalAuthButtonElement.disabled) return;
        try {
            this.setAuthStatusMessage(this.pi.getLangString("AUTH_STATUS_CONNECTING"), 'yellow');

            const host = PluginData.normalizeHost(this.pi.globalHostElement.value);
            const port = PluginData.parsePort(this.pi.globalPortElement.value);
            this.pi.globalHostElement.value = host;
            this.pi.globalPortElement.value = String(port);

            const connector = getCompanionConnector();
            connector.settings = {
                appId: PluginData.APP_ID,
                appName: PluginData.APP_NAME,
                appVersion: PluginData.APP_VERSION,
                host,
                port
            };

            this.setAuthStatusMessage(
                `${this.pi.getLangString("AUTH_STATUS_AUTHORIZING")}\n${this.pi.getLangString("AUTH_CODE_COMPARE")}`,
                'yellow'
            );
            const authToken = await connector.restClient.requestAuth();

            if (authToken.token) {
                this.authToken = authToken.token;
                this.setAuthStatusMessage(this.pi.getLangString("AUTH_STATUS_CONNECTED"), 'green');
                this.saveSettings();
            } else {
                this.authErrorCatched(authToken);
            }
        } catch (e) {
            this.authErrorCatched(e);
        }
    }

    private authErrorCatched(err: any) {
        this.pi.logMessage(`Auth error: ${JSON.stringify(err)}`);
        let msg = "";
        if (isErrorOutput(err)) {
            msg = err.message;
        } else {
            msg = JSON.stringify(err);
        }
        if (!this.pi.globalAuthStatusElement) {
            alert(`${this.pi.getLangString("AUTH_STATUS_ERROR")}\n${msg}`);
            return;
        }
        this.setAuthStatusMessage(`${this.pi.getLangString("AUTH_STATUS_ERROR")}\n${msg}`, 'red');
        this.pi.globalSettingsDetailsElement.open = true;
    }

    private saveSettingsIfLoaded() {
        if (!this.settingsLoaded) return;
        this.saveSettings();
    }

    private saveSettings() {
        const host = PluginData.normalizeHost(this.pi.globalHostElement.value);
        const port = PluginData.parsePort(this.pi.globalPortElement.value);
        this.pi.globalHostElement.value = host;
        this.pi.globalPortElement.value = String(port);

        this.pi.settingsManager.setGlobalSettings({host, port: String(port), token: this.authToken});
        this.ensureSocketClient(host, String(port), this.authToken);
    }
}
