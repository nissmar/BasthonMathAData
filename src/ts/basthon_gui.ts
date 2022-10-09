//jquery
import * as $ from "jquery";
// basthon
import { GUIBase, GUIOptions } from "@basthon/gui-base";
const dialog = require('../js/base/js/dialog');


/**
 * Basthon part of the notebook GUI.
 */
export class GUI extends GUIBase {
    private _notebook?: any;
    private _events?: any;

    public constructor(options: GUIOptions) {
        super((() => { options.uiName = "notebook"; return options; })());
        this._contentFilename = "Untitled.ipynb";
        this._urlKey = "ipynb";

        /* register extensions */
        const admonitionLoader = async () => {
            const marked = require("marked");
            const admonition = (await import("marked-admonition-extension")).default;
            //@ts-ignore
            import("../css/admonition.css");
            marked.use(admonition);
        };
        this.registerExtension("admonition", admonitionLoader);
        this.registerExtension("admonitions", admonitionLoader);
    }

    /**
     * Get notebook's content.
     */
    public content(): string {
        return JSON.stringify(this._notebook.toJSON());
    }

    /**
     * Set notebook's content.
     */
    public setContent(content: string): void {
        if (!content) return;
        let ipynb: string;
        try {
            ipynb = JSON.parse(content);
        } catch (e: any) {
            throw new Error(`Impossible d'ouvrir le notebook : l'ipynb est corrompu.\n${e.toString()}`);
        }
        try {
            this._notebook.fromJSON(ipynb);
        } catch (e: any) {
            throw new Error(`Impossible d'ouvrir le notebook : l'ipynb n'est pas conforme.\n${e.toString()}`);
        }
    }

    /**
     * Notify the user with an error.
     */
    public error(title: string, message: string) {
        dialog.modal({
            notebook: this._notebook,
            keyboard_manager: this._notebook?.keyboard_manager,
            title: title,
            body: $('<div>').html(message),
            buttons: {
                OK: {
                    "class": "btn-danger",
                },
            },
        });
    }

    /**
     * Notify the user.
     */
    public info(title: string, message: string) {
        dialog.modal({
            notebook: this._notebook,
            keyboard_manager: this._notebook?.keyboard_manager,
            title: title,
            body: $('<div>').html(message),
            buttons: {
                OK: {
                    "class": "btn-primary",
                },
            },
        });
    }

    /**
     * Ask the user to confirm or cancel.
     */
    public confirm(
        title: string,
        message: string,
        text: string,
        callback: (() => void),
        textCancel: string,
        callbackCancel: (() => void)): void {
        dialog.modal({
            notebook: this._notebook,
            keyboard_manager: this._notebook.keyboard_manager,
            title: title,
            body: $('<div>').html(message),
            buttons: {
                [text]: {
                    "class": "btn-primary",
                    "click": callback
                },
                [textCancel]: {
                    "click": callbackCancel
                }
            }
        });
    }

    /**
     * Ask the user to select a choice.
     */
    public select(
        title: string,
        message: string,
        choices: {
            text: string,
            handler: () => void
        }[],
        textCancel: string,
        callbackCancel: (() => void)): void {
        // build select menu
        let selected = 0;
        const selectMenu = $('<div class="list-group" style="max-width: 200px; margin: auto; margin-top: 10px;">');
        choices.forEach((c, i) => {
            const item = $('<a href="#">').html(c.text);
            item.addClass("list-group-item");
            item.addClass("list-group-item-action");
            if (i == 0) item.addClass("active");
            item.click(() => {
                item.parent().find('a').removeClass('active');
                item.addClass('active');
                selected = i;
            });
            selectMenu.append(item);
        });
        const body = $('<div>')
            .append($('<p>').html(message))
            .append(selectMenu);
        dialog.modal({
            notebook: this._notebook,
            keyboard_manager: this._notebook.keyboard_manager,
            title: title,
            body: body,
            buttons: {
                OK: {
                    "class": "btn-primary",
                    "click": () => {
                        const handler = choices[selected].handler;
                        if (handler != null) handler();
                    },
                },
                [textCancel]: {
                    "click": callbackCancel || (() => { }),
                }
            }
        });
    }

    /**
     * Get current darkmode.
     */
    private async _getDarkmode(): Promise<boolean> {
        return await this.getState("darkmode", false);
    }

    /**
     * Get mode as a string (dark/light).
     */
    public async theme() {
        const darkmode = await this._getDarkmode();
        return darkmode ? "dark" : "light";
    }

    /**
     * Switch dark/light mode.
     */
    public async switchDarkLight() {
        const darkmode = await this._getDarkmode();
        await this.setState("darkmode", !darkmode);
        await this.updateDarkLight();
    }

    /**
     * Update dark/light appearence.
     */
    public async updateDarkLight() {
        const darkmode = await this._getDarkmode();
        const mode = darkmode ? 'dark' : 'light';
        this._notebook?.set_theme(mode);
    }

    protected async setupUI(options: any) {
        this._notebook = options?.notebook;
        this._contentFilename = this._notebook.notebook_name ?? this._contentFilename;
        await super.setupUI(options);

        await this.updateDarkLight();

        // avoiding notebook loading failure.
        if (!this._notebook) location.reload();

        // keeping back events from notebook.
        this._events = this._notebook.events;

        if (!this._notebook._fully_loaded) {
            await new Promise((resolve, reject) =>
                this._events.on('notebook_loaded.Notebook', resolve)
            );
        }

        // alert when opening old Python 3.8 notebook
        if (this.language === "python3-old") {
            const callback = () => {
                const url = new URL(window.location.href);
                url.searchParams.set("kernel", "python3");
                window.location.href = url.toString();
            };
            this.confirm(
                "Ouvrir avec la dernière version de Basthon ?",
                "Ce notebook utilise une version ancienne du" +
                " noyau de Basthon (Python 3.8) qui ne sera " +
                "bientôt plus maintenue. Voulez-vous utiliser " +
                "la dernière version du noyau (Python 3.10) ?",
                "Utiliser Python 3.10", callback,
                "Rester avec Python 3.8", () => {});
        }
    }

    /**
     * Sharing notebook via URL.
     */
    public async share() {
        this._events.trigger('before_share.Notebook');
        super.share();
        this._events.trigger('notebook_shared.Notebook');
    };

    /**
     * Load the content of a Python script in first cell.
     */
    public async loadPythonInCell(file: File): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = async (event) => {
                const new_cell = this._notebook.insert_cell_above('code', 0);
                new_cell.set_text(event?.target?.result);
                // notification seems useless here.
                resolve();
            };
            reader.onerror = reject;
        });
    }

    /**
     * Open *.py file by asking user what to do:
     * load in notebook cell or put on (emulated) local filesystem.
     */
    public async openPythonFile(file: File) {
        const msg = $("<div>").html(
            "Que faire de " + file.name + " ?");
        this.confirm(
            "Que faire du fichier ?",
            msg,
            "Charger dans le notebook",
            () => { this.loadPythonInCell(file); },
            "Installer le module",
            () => { this.putFSRessource(file); },
        );
    }

    /**
     * Opening file: If it has .ipynb extension, load the notebook,
     * if it has .py extension, loading it in the first cell
     * or put on (emulated) local filesystem (user is asked to),
     * otherwise, loading it in the local filesystem.
     */
    public async openFile() {
        return await this._openFile({
            'py': this.openPythonFile.bind(this),
            'ipynb': this.open.bind(this)
        });
    }
}
