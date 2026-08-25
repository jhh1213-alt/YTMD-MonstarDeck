import {PluginData} from '../shared/plugin-data';
import {ErrorOutput, Settings} from './types';

export class ApiHttp {
    constructor(private getSettings: () => Settings) {}

    baseUrl(): string {
        const {host, port} = this.getSettings();
        return `http://${PluginData.normalizeHost(host)}:${PluginData.parsePort(port)}`;
    }

    private headers(withAuth: boolean, json = false): HeadersInit {
        const headers: Record<string, string> = {};
        if (json) {
            headers['Content-Type'] = 'application/json';
        }
        const token = this.getSettings().token;
        if (withAuth && token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    private async parseError(response: Response): Promise<ErrorOutput> {
        let message = response.statusText || 'Request failed';
        let error = 'Error';
        try {
            const body = await response.json();
            if (body?.message) message = body.message;
            if (body?.error) error = body.error;
        } catch {
            // ignore non-JSON error bodies
        }
        return {
            statusCode: response.status,
            error,
            message,
        };
    }

    async request<T>(
        method: string,
        path: string,
        options: {auth?: boolean; body?: unknown; allowEmpty?: boolean} = {}
    ): Promise<T> {
        const {auth = true, body, allowEmpty = true} = options;
        let response: Response;
        try {
            response = await fetch(`${this.baseUrl()}${path}`, {
                method,
                headers: this.headers(auth, body !== undefined),
                body: body !== undefined ? JSON.stringify(body) : undefined,
                cache: 'no-store',
            });
        } catch (e) {
            throw {
                statusCode: 0,
                error: 'NetworkError',
                message: e instanceof Error ? e.message : 'Network error',
            } satisfies ErrorOutput;
        }

        if (response.status === 204) {
            return undefined as T;
        }

        if (!response.ok) {
            throw await this.parseError(response);
        }

        const text = await response.text();
        if (!text) {
            if (allowEmpty) {
                return undefined as T;
            }
            throw {
                statusCode: response.status,
                error: 'EmptyResponse',
                message: 'Empty response',
            } satisfies ErrorOutput;
        }

        return JSON.parse(text) as T;
    }

    get<T>(path: string, auth = true): Promise<T> {
        return this.request<T>('GET', path, {auth});
    }

    post<T>(path: string, body?: unknown, auth = true): Promise<T> {
        return this.request<T>('POST', path, {auth, body});
    }
}
