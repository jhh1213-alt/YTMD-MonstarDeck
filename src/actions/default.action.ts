import {
    KeyDownEvent,
    KeyUpEvent,
    StreamDeckAction,
    WillAppearEvent,
    WillDisappearEvent,
} from 'streamdeck-typescript';
import { YTMD } from '../ytmd';
import {RestClient, StateClient} from "../api-server";

export abstract class DefaultAction<Instance> extends StreamDeckAction<
    YTMD,
    Instance
> {
    socket: StateClient;
    rest: RestClient;

    protected constructor(plugin: YTMD, actionName: string) {
        super(plugin, actionName);
        this.socket = YTMD.COMPANION.socketClient;
        this.rest = YTMD.COMPANION.restClient;
        console.info(`Initialized ${actionName}`);
        plugin.logMessage(`Initialized ${actionName}`);
    }

    abstract onContextAppear(event: WillAppearEvent): void;

    abstract onKeypressUp(event: KeyUpEvent): void;

    abstract onContextDisappear(event: WillDisappearEvent): void;

    onKeypressDown(event: KeyDownEvent): void {}
}
