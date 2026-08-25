import {PluginData} from '../shared/plugin-data';
import {ApiHttp} from './http';
import {RestClient} from './rest-client';
import {StateClient} from './state-client';
import {Settings} from './types';

export class ApiServerConnector {
    public readonly restClient: RestClient;
    public readonly socketClient: StateClient;
    private _settings: Settings;
    private readonly http: ApiHttp;

    constructor(settings: Settings) {
        this._settings = {...settings};
        this.http = new ApiHttp(() => this._settings);
        this.restClient = new RestClient(this.http, () => this._settings);
        this.socketClient = new StateClient(this.restClient, () => this._settings);
    }

    get settings(): Settings {
        return this._settings;
    }

    set settings(value: Settings) {
        const previous = this._settings;
        this._settings = {
            ...value,
            host: PluginData.normalizeHost(value.host),
            port: PluginData.parsePort(value.port, previous.port),
        };
        const changed =
            previous.host !== this._settings.host ||
            previous.port !== this._settings.port ||
            previous.token !== this._settings.token;
        if (changed && this._settings.token) {
            this.socketClient.connect();
        } else if (changed && !this._settings.token) {
            this.socketClient.disconnect();
        }
    }
}
