import { Logger } from "./logger.js";
import { SceneSerializer } from "./sceneSerializer.js";
/**
 * Class used to connect with the reflector zone of the sandbox via the reflector bridge
 * @since 5.0.0
 */
export class Reflector {
    /**
     * Constructs a reflector object.
     * @param scene The scene to use
     * @param hostname The hostname of the reflector bridge
     * @param port The port of the reflector bridge
     */
    constructor(scene, hostname, port) {
        this._scene = scene;
        Logger.Log(`[Reflector] Connecting to ws://${hostname}:${port}`);
        this._webSocket = new WebSocket(`ws://${hostname}:${port}`);
        this._webSocket.onmessage = (event) => {
            const message = event.data;
            if (message.startsWith(Reflector._SERVER_PREFIX)) {
                const serverMessage = message.substring(Reflector._SERVER_PREFIX.length);
                Logger.Log(`[Reflector] Received server message: ${serverMessage.substring(0, 64)}`);
                this._handleServerMessage(serverMessage);
                return;
            }
            else {
                Logger.Log(`[Reflector] Received client message: ${message.substring(0, 64)}`);
                this._handleClientMessage();
            }
        };
        this._webSocket.onclose = (event) => {
            Logger.Log(`[Reflector] Disconnected ${event.code} ${event.reason}`);
        };
    }
    /**
     * Closes the reflector connection
     */
    close() {
        this._webSocket.close();
    }
    _handleServerMessage(message) {
        switch (message) {
            case "connected": {
                SceneSerializer.SerializeAsync(this._scene).then((serialized) => {
                    this._webSocket.send(`load|${JSON.stringify(serialized)}`);
                });
                break;
            }
        }
    }
    _handleClientMessage() {
        // do nothing
    }
}
Reflector._SERVER_PREFIX = "$$";
//# sourceMappingURL=reflector.js.map