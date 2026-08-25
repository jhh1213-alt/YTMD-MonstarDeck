import {
    LikeStatus,
    RepeatMode,
    SongApiResponse,
    StateOutput,
    TrackState,
    VolumeApiResponse,
} from './types';

export function mapLikeStatus(value?: string | null): LikeStatus {
    switch ((value ?? '').toUpperCase()) {
        case 'LIKE':
            return LikeStatus.LIKE;
        case 'DISLIKE':
            return LikeStatus.DISLIKE;
        case 'INDIFFERENT':
            return LikeStatus.INDIFFERENT;
        default:
            return LikeStatus.UNKNOWN;
    }
}

export function mapRepeatMode(value?: string | null): RepeatMode {
    switch ((value ?? '').toUpperCase()) {
        case 'ALL':
            return RepeatMode.ALL;
        case 'ONE':
            return RepeatMode.ONE;
        case 'NONE':
            return RepeatMode.NONE;
        default:
            return RepeatMode.UNKNOWN;
    }
}

export function repeatModeToApi(mode: RepeatMode): 'NONE' | 'ALL' | 'ONE' {
    switch (mode) {
        case RepeatMode.ALL:
            return 'ALL';
        case RepeatMode.ONE:
            return 'ONE';
        default:
            return 'NONE';
    }
}

export function clicksToRepeatMode(current: RepeatMode, target: RepeatMode): number {
    const order = [RepeatMode.NONE, RepeatMode.ALL, RepeatMode.ONE];
    const from = order.indexOf(current === RepeatMode.UNKNOWN ? RepeatMode.NONE : current);
    const to = order.indexOf(target === RepeatMode.UNKNOWN ? RepeatMode.NONE : target);
    if (from < 0 || to < 0) {
        return 1;
    }
    return (to - from + order.length) % order.length;
}

export function mapSongToState(
    song: SongApiResponse | null,
    volume: VolumeApiResponse | null,
    likeStatus: LikeStatus,
    repeatMode: RepeatMode
): StateOutput {
    const isMuted = volume?.isMuted === true;
    const volumeValue = isMuted ? 0 : (volume?.state ?? 50);
    const cover = song?.imageSrc ?? '';

    return {
        player: {
            trackState: song
                ? (song.isPaused === true ? TrackState.PAUSED : TrackState.PLAYING)
                : TrackState.UNKNOWN,
            videoProgress: song?.elapsedSeconds ?? 0,
            volume: volumeValue,
            queue: {
                repeatMode: repeatMode === RepeatMode.UNKNOWN ? RepeatMode.NONE : repeatMode,
            },
        },
        video: song
            ? {
                author: song.artist ?? '',
                title: song.title ?? '',
                album: song.album ?? null,
                likeStatus,
                thumbnails: [{url: cover}],
                durationSeconds: song.songDuration ?? 0,
                id: song.videoId,
            }
            : null,
        playlistId: song?.playlistId,
    };
}
