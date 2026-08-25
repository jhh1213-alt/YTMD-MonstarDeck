export enum TrackState {
    UNKNOWN = -1,
    PAUSED = 0,
    PLAYING = 1,
    BUFFERING = 2,
}

export enum LikeStatus {
    UNKNOWN = -1,
    DISLIKE = 0,
    INDIFFERENT = 1,
    LIKE = 2,
}

export enum RepeatMode {
    UNKNOWN = -1,
    NONE = 0,
    ALL = 1,
    ONE = 2,
}

export enum SocketState {
    CONNECTING = 0,
    CONNECTED = 1,
    DISCONNECTED = 2,
    ERROR = 3,
}

export interface ErrorOutput {
    statusCode: number;
    error: string;
    message: string;
}

export interface PlaylistOutput {
    id: string;
    title: string;
}

export interface Settings {
    appId: string;
    appName: string;
    appVersion: string;
    host: string;
    port: number;
    token?: string;
}

export interface StateOutput {
    player: {
        trackState: TrackState;
        videoProgress: number;
        volume: number;
        queue: {
            repeatMode: RepeatMode;
        } | null;
    };
    video: {
        author: string;
        title: string;
        album: string | null;
        likeStatus: LikeStatus | null;
        thumbnails: { url: string; width?: number; height?: number }[];
        durationSeconds: number;
        id?: string;
    } | null;
    playlistId?: string;
}

export type StateListener = (state: StateOutput) => void;
export type ConnectionListener = (state: SocketState) => void;
export type ErrorListener = (error: any) => void;

export interface SongApiResponse {
    title?: string;
    artist?: string;
    album?: string | null;
    imageSrc?: string | null;
    isPaused?: boolean;
    songDuration?: number;
    elapsedSeconds?: number;
    videoId?: string;
    playlistId?: string;
    url?: string;
}

export interface VolumeApiResponse {
    state?: number;
    isMuted?: boolean;
}

export interface LikeStateApiResponse {
    state?: string | null;
}

export interface RepeatModeApiResponse {
    mode?: string | null;
}

export function isErrorOutput(value: unknown): value is ErrorOutput {
    return (
        typeof value === 'object' &&
        value !== null &&
        'statusCode' in value &&
        'message' in value
    );
}
