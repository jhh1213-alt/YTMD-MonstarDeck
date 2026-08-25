import {DidReceiveSettingsEvent} from 'streamdeck-typescript';
import {YTMDPi} from '../../ytmd-pi';
import {PisAbstract} from '../pis.abstract';
import {PlaylistSettings} from "../../interfaces/context-settings.interface";

export class PlayPlaylistPi extends PisAbstract {
    private currentSettings: PlaylistSettings = {};

    constructor(pi: YTMDPi, context: string, sectionElement: HTMLElement) {
        super(pi, context, sectionElement);
        this.pi.playlistSaveElement.onclick = () => this.saveSettings();
        this.pi.playlistRefreshButtonElement.onclick = () => this.showListUnsupported();
        this.pi.playlistUrlElement.addEventListener('input', () => this.updateUrlStatus());
        this.pi.playlistSelectElement.disabled = true;
        this.pi.requestSettings();
        this.pi.requestGlobalSettings();
    }

    public newGlobalSettingsReceived(): void {
    }

    public newSettingsReceived({payload: {settings}}: DidReceiveSettingsEvent<PlaylistSettings>): void {
        this.currentSettings = settings ?? {};
        this.pi.playlistUrlElement.value = settings.playlistUrl ?? '';
        this.pi.playlistSelectElement.value = '';
        this.updateUrlStatus();
    }

    private showListUnsupported() {
        this.pi.removeError('playlist-fetch-error');
        this.pi.showError(
            'playlist-fetch-error',
            this.pi.getLangString("PLAYLIST_ERROR_TITLE"),
            this.pi.getLangString("PLAYLIST_LIST_UNSUPPORTED")
        );
    }

    private saveSettings() {
        const playlistUrl = this.pi.playlistUrlElement.value;

        this.settingsManager.setContextSettingsAttributes(this.context, {
            playlistId: this.extractPlaylistId(playlistUrl) || undefined,
            playlistUrl: playlistUrl || undefined
        });
    }

    private extractPlaylistId(urlValue: string): string | undefined {
        try {
            return new URL(urlValue.trim()).searchParams.get('list') ?? undefined;
        } catch {
            return undefined;
        }
    }

    private updateUrlStatus() {
        const status = this.pi.playlistUrlStatusElement;
        const urlValue = this.pi.playlistUrlElement.value.trim();
        if (!urlValue) {
            status.textContent = '';
            status.style.color = '';
            return;
        }

        try {
            const parsed = new URL(urlValue);
            const listParam = parsed.searchParams.get('list');
            if (!listParam) {
                status.textContent = this.pi.getLangString("PLAYLIST_URL_STATUS_MISSING_LIST");
                status.style.color = 'orange';
                return;
            }
            status.textContent = this.pi.getLangString("PLAYLIST_URL_STATUS_VALID");
            status.style.color = 'green';
        } catch (e) {
            status.textContent = this.pi.getLangString("PLAYLIST_URL_STATUS_INVALID");
            status.style.color = 'red';
        }
    }
}
