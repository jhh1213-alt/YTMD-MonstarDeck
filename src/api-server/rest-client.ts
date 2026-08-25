import {ApiHttp} from './http';
import {clicksToRepeatMode, mapLikeStatus, mapRepeatMode} from './map-state';
import {
    ErrorOutput,
    LikeStateApiResponse,
    LikeStatus,
    RepeatMode,
    RepeatModeApiResponse,
    Settings,
    SongApiResponse,
    VolumeApiResponse,
} from './types';

export class RestClient {
    constructor(private http: ApiHttp, private getSettings: () => Settings) {}

    async requestAuth(): Promise<{token: string}> {
        const {appId} = this.getSettings();
        const result = await this.http.post<{accessToken?: string}>(
            `/auth/${encodeURIComponent(appId)}`,
            undefined,
            false
        );
        if (!result?.accessToken) {
            throw {
                statusCode: 403,
                error: 'AuthFailed',
                message: 'No access token returned. Deny the request or enable API Server auth.',
            } satisfies ErrorOutput;
        }
        return {token: result.accessToken};
    }

    async getSong(): Promise<SongApiResponse | null> {
        try {
            const song = await this.http.get<SongApiResponse | undefined>('/api/v1/song');
            return song ?? null;
        } catch (e) {
            const err = e as ErrorOutput;
            if (err?.statusCode === 404) {
                const fallback = await this.http.get<SongApiResponse | undefined>('/api/v1/song-info');
                return fallback ?? null;
            }
            throw e;
        }
    }

    async getVolume(): Promise<VolumeApiResponse | null> {
        try {
            return (await this.http.get<VolumeApiResponse>('/api/v1/volume')) ?? null;
        } catch (e) {
            const err = e as ErrorOutput;
            if (err?.statusCode === 404) {
                return null;
            }
            throw e;
        }
    }

    async getLikeStatus(): Promise<LikeStatus> {
        try {
            const result = await this.http.get<LikeStateApiResponse>('/api/v1/like-state');
            return mapLikeStatus(result?.state);
        } catch (e) {
            const err = e as ErrorOutput;
            if (err?.statusCode === 404) {
                return LikeStatus.UNKNOWN;
            }
            throw e;
        }
    }

    async getRepeatMode(): Promise<RepeatMode> {
        try {
            const result = await this.http.get<RepeatModeApiResponse>('/api/v1/repeat-mode');
            return mapRepeatMode(result?.mode);
        } catch (e) {
            const err = e as ErrorOutput;
            if (err?.statusCode === 404) {
                return RepeatMode.UNKNOWN;
            }
            throw e;
        }
    }

    playPause(): Promise<void> {
        return this.http.post('/api/v1/toggle-play');
    }

    play(): Promise<void> {
        return this.http.post('/api/v1/play');
    }

    pause(): Promise<void> {
        return this.http.post('/api/v1/pause');
    }

    next(): Promise<void> {
        return this.http.post('/api/v1/next');
    }

    previous(): Promise<void> {
        return this.http.post('/api/v1/previous');
    }

    setVolume(volume: number): Promise<void> {
        const clamped = Math.max(0, Math.min(100, Math.round(volume)));
        return this.http.post('/api/v1/volume', {volume: clamped});
    }

    async toggleLike(): Promise<void> {
        return this.http.post('/api/v1/like');
    }

    async toggleDislike(): Promise<void> {
        return this.http.post('/api/v1/dislike');
    }

    shuffle(): Promise<void> {
        return this.http.post('/api/v1/shuffle');
    }

    async repeatMode(mode: RepeatMode): Promise<void> {
        let current = RepeatMode.UNKNOWN;
        try {
            current = await this.getRepeatMode();
        } catch {
            current = RepeatMode.UNKNOWN;
        }

        if (current === mode) {
            return;
        }

        const iteration = current === RepeatMode.UNKNOWN ? 1 : clicksToRepeatMode(current, mode);
        if (iteration <= 0) {
            return;
        }

        await this.http.post('/api/v1/switch-repeat', {iteration});
    }

    async changeVideo(data: {videoId?: string; playlistId?: string; url?: string}): Promise<void> {
        const playlistId = this.resolvePlaylistId(data.playlistId, data.url);
        if (!playlistId) {
            throw {
                statusCode: 400,
                error: 'InvalidPlaylist',
                message: 'A playlist URL with a list parameter or a playlist id is required.',
            } satisfies ErrorOutput;
        }

        const payloads = [
            {path: '/api/v1/playPlaylist', body: {playlistId, videoId: data.videoId ?? null}},
            {path: '/api/v1/play-playlist', body: {playlistId, videoId: data.videoId ?? null}},
        ];
        for (const payload of payloads) {
            try {
                await this.http.post(payload.path, payload.body);
                return;
            } catch (e) {
                const err = e as ErrorOutput;
                if (err?.statusCode !== 404) {
                    throw e;
                }
            }
        }

        throw {
            statusCode: 404,
            error: 'Unsupported',
            message: 'This YouTube Music API Server version cannot start playlists. Update the app or play the playlist in the app first.',
        } satisfies ErrorOutput;
    }

    private resolvePlaylistId(playlistId?: string, url?: string): string | undefined {
        const direct = playlistId?.trim();
        if (direct) {
            return direct;
        }
        const raw = url?.trim();
        if (!raw) {
            return undefined;
        }
        try {
            return new URL(raw).searchParams.get('list') ?? undefined;
        } catch {
            return undefined;
        }
    }
}
