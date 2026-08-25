import {mapLikeStatus, mapSongToState} from './map-state';
import {RestClient} from './rest-client';
import {
    ConnectionListener,
    ErrorListener,
    ErrorOutput,
    LikeStatus,
    RepeatMode,
    Settings,
    SocketState,
    StateListener,
    StateOutput,
} from './types';

const POLL_MS = 1000;

export class StateClient {
    private stateListeners = new Set<StateListener>();
    private connectionListeners = new Set<ConnectionListener>();
    private errorListeners = new Set<ErrorListener>();
    private timer: number | undefined;
    private connectionState: SocketState = SocketState.DISCONNECTED;
    private lastVolume: {state: number; isMuted: boolean} | null = null;
    private lastLike = LikeStatus.UNKNOWN;
    private lastRepeat = RepeatMode.NONE;

    constructor(private rest: RestClient, private getSettings: () => Settings) {}

    connect(): void {
        this.stop();
        if (!this.getSettings().token) {
            this.setConnection(SocketState.DISCONNECTED);
            return;
        }
        this.setConnection(SocketState.CONNECTING);
        void this.poll();
        this.timer = window.setInterval(() => {
            void this.poll();
        }, POLL_MS);
    }

    disconnect(): void {
        this.stop();
        this.setConnection(SocketState.DISCONNECTED);
    }

    addStateListener(listener: StateListener): void {
        this.stateListeners.add(listener);
    }

    removeStateListener(listener: StateListener): void {
        this.stateListeners.delete(listener);
    }

    addConnectionStateListener(listener: ConnectionListener): void {
        this.connectionListeners.add(listener);
        listener(this.connectionState);
    }

    removeConnectionStateListener(listener: ConnectionListener): void {
        this.connectionListeners.delete(listener);
    }

    addErrorListener(listener: ErrorListener): void {
        this.errorListeners.add(listener);
    }

    removeErrorListener(listener: ErrorListener): void {
        this.errorListeners.delete(listener);
    }

    private stop(): void {
        if (this.timer !== undefined) {
            window.clearInterval(this.timer);
            this.timer = undefined;
        }
    }

    private setConnection(state: SocketState): void {
        if (this.connectionState === state) {
            return;
        }
        this.connectionState = state;
        this.connectionListeners.forEach((listener) => listener(state));
    }

    private emitState(state: StateOutput): void {
        this.stateListeners.forEach((listener) => listener(state));
    }

    private emitError(error: any): void {
        this.errorListeners.forEach((listener) => listener(error));
    }

    private async poll(): Promise<void> {
        if (!this.getSettings().token) {
            this.stop();
            this.setConnection(SocketState.DISCONNECTED);
            return;
        }

        try {
            const [song, volume, likeStatus, repeatMode] = await Promise.all([
                this.rest.getSong(),
                this.rest.getVolume().catch(() => this.lastVolume),
                this.rest.getLikeStatus().catch(() => this.lastLike),
                this.rest.getRepeatMode().catch(() => this.lastRepeat),
            ]);

            if (volume) {
                this.lastVolume = {
                    state: volume.state ?? this.lastVolume?.state ?? 50,
                    isMuted: volume.isMuted ?? false,
                };
            }
            this.lastLike = likeStatus;
            if (repeatMode !== RepeatMode.UNKNOWN) {
                this.lastRepeat = repeatMode;
            }

            this.setConnection(SocketState.CONNECTED);
            this.emitState(mapSongToState(
                song,
                this.lastVolume,
                this.lastLike,
                this.lastRepeat
            ));
        } catch (e) {
            const err = e as ErrorOutput;
            this.setConnection(err?.statusCode === 401 ? SocketState.ERROR : SocketState.DISCONNECTED);
            if (err?.statusCode === 401) {
                this.emitError(e);
            } else {
                this.emitError(new Error('websocket error'));
            }
        }
    }
}
