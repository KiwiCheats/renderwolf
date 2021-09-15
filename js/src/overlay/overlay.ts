import { AppWindow } from "../AppWindow";
import { OverWolfPlugin } from './OverWolfPlugin'

class OverlayWindow extends AppWindow {
    private static _instance: OverlayWindow;
    private _plugin: OverWolfPlugin;
    private _inFocus: boolean;
    private _running: boolean;

    private _width: number;
    private _height: number;

    private constructor() {
        super('overlay');

        let plugin = new OverWolfPlugin("renderwolf-plugin", true);

        plugin.initialize(status => {
            if (!status) {
                console.log("plugin failed to initialize");

                return;
            }

            this._plugin = plugin;

            overwolf.games.onGameInfoUpdated.addListener(GameInfoChangeData => {
                if (GameInfoChangeData.gameInfo.isRunning && GameInfoChangeData.gameInfo.isInFocus) {
                    if (!this._running) {
                        this._inFocus = true;

                        if (GameInfoChangeData.gameInfo) {
                            const info = GameInfoChangeData.gameInfo;

                            this._width = info.width;
                            this._height = info.height;

                            overwolf.windows.getCurrentWindow(result => {
                                if (!result.success)
                                    return;

                                const plugin = this._plugin.get();
                                
                                plugin.Start();

                                overwolf.windows.changePosition(result.window.id, 0, 0);
                                overwolf.windows.changeSize(result.window.id, info.width, info.height);

                                plugin.SetInfo(info.width, info.height);

                                this.renderLoop();
                            });
                        }

                        this.renderLoop();
                    }

                    return;
                }

                if (!GameInfoChangeData.gameInfo.isRunning)
                    this._plugin.get().Stop();

                this._inFocus = false;
            });
        });
    }

    private async renderLoop() {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        const ctx = canvas.getContext('2d');

        let renderer = this._plugin.get();
        let image = new Image();

        image.onload = () => {
            canvas.width = this._width;
            canvas.height = this._height;

            ctx.drawImage(image, 0, 0);
        };

        let lastFrame;
        while (this._inFocus) {
            const frame = renderer.Frame();

            if (lastFrame != frame) {
                lastFrame = frame;

                image.src = frame;
            }

            await this.sleep(5);
        }
    }

    private sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    public static instance() {
        if (!this._instance) {
            this._instance = new OverlayWindow();
        }

        return this._instance;
    }

    public run() {
        overwolf.games.getRunningGameInfo(gameInfo => {
            if (!gameInfo)
                return;

            this._width = gameInfo.width;
            this._height = gameInfo.height;

            overwolf.windows.getCurrentWindow(result => {
                if (!result.success)
                    return;

                const plugin = this._plugin.get();

                plugin.Start();

                overwolf.windows.changePosition(result.window.id, 0, 0);
                overwolf.windows.changeSize(result.window.id, gameInfo.width, gameInfo.height);

                plugin.SetInfo(this._width, this._height);

                this.renderLoop();
            });
        });
    }
}

OverlayWindow.instance().run();