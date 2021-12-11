//jquery
import * as $ from "jquery";
// basthon
import { GUIBase } from "@basthon/gui-base";
const dialog = require('../js/base/js/dialog');

declare global {
    interface Window {
        basthonEmptyNotebook?: any;
    }
}


/**
 * Basthon part of the notebook GUI.
 */
export class GUI extends GUIBase {
    private _notebook?: any;
    private _events?: any;

    public constructor(kernelRootPath: string, language: string) {
        super(kernelRootPath, language);
    }

    /**
     * Notify the user with an error.
     */
    public error(title: string, message: string) {
        dialog.modal({
            notebook: this._notebook,
            keyboard_manager: this._notebook?.keyboard_manager,
            title: title,
            body: message,
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
            body: message,
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
            body: message,
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
        const msg = $("<div>").html(message);
        const buttons: { [key: string]: any } = {};
        choices.forEach((c) => {
            buttons[c.text] = {
                "class": "btn-primary",
                "click": c.handler || (() => { }),
            }
        });
        buttons[textCancel] = {
            "click": callbackCancel || (() => { }),
        };
        dialog.modal({
            notebook: this._notebook,
            keyboard_manager: this._notebook.keyboard_manager,
            title: title,
            body: msg,
            buttons: buttons,
        });
    }

    /**
     * Effective implementation for init.
     */
    protected async _init(options: any) {
        await super._init(options);

        this._notebook = options?.notebook;
        // avoiding notebook loading failure.
        if (!this._notebook) {
            location.reload();
        }

        // keeping back events from notebook.
        this._events = this._notebook.events;

        if (!this._notebook._fully_loaded) {
            await new Promise((resolve, reject) =>
                this._events.on('notebook_loaded.Notebook', resolve)
            );
        }

        /*
          loading content from query string or from local storage.
          if global variale basthonEmptyNotebook is set to true,
          we open a new notebook
          (see kernelselector.js).
        */
        await Promise.all([
            (async () => {
                if (!window.basthonEmptyNotebook && !await this.loadFromQS())
                    this._notebook.loadFromStorage();
            })(),
            this.kernelLoader.kernelLoaded()
        ]);

        const init = this.initCaller.bind(this);
        // loading aux files from URL
        await init(this.loadURLAux.bind(this), "Chargement des fichiers auxiliaires...", true);
        // loading modules from URL
        await init(this.loadURLModules.bind(this), "Chargement des modules annexes...", true);
        // end
        this.kernelLoader.hideLoader();

        /* saving to storage on multiple events */
        for (let event of ['execute.CodeCell',
            'finished_execute.CodeCell']) {
            this._events.bind(event, () => { this.saveToStorage(); });
        }
    }

    /**
     * Loading the notebook from query string (ipynb= or file=).
     */
    public async loadFromQS() {
        const url = new URL(window.location.href);
        const ipynb_key = 'ipynb';
        const from_key = 'from';
        let ipynb: string = "";
        if (url.searchParams.has(ipynb_key)) {
            ipynb = url.searchParams.get(ipynb_key) || "";
            try {
                ipynb = await this.inflate(ipynb);
            } catch (error) {
                /* backward compatibility with non compressed param */
                if (ipynb != null) ipynb = decodeURIComponent(ipynb);
            }
        } else if (url.searchParams.has(from_key)) {
            let fileURL = url.searchParams.get(from_key);
            if (fileURL != null) fileURL = decodeURIComponent(fileURL);
            try {
                ipynb = await GUIBase.xhr({
                    url: fileURL,
                    method: 'GET'
                }) as string;
            } catch (error) {
                const message = `Le chargement du script ${fileURL} a échoué.`;
                throw new ErrorEvent(message, { message: message });
            }
        }
        if (ipynb) {
            this._notebook.load(JSON.parse(ipynb));
            return ipynb;
        }
    }

    /**
     * Converting notebook to URL to later access the notebook content.
     */
    public async notebookToURL(key = "ipynb") {
        let ipynb: string = JSON.stringify(this._notebook.toIpynb());
        const url = new URL(window.location.href);
        url.hash = "";
        url.searchParams.delete("from"); // take care of collapsing params
        try {
            ipynb = await this.deflate(ipynb);
        } catch (error) { // fallback
            ipynb = encodeURIComponent(ipynb).replace(/\(/g, '%28').replace(/\)/g, '%29');
        }
        url.searchParams.set(key, ipynb);
        return url.href;
    }

    /**
     * Sharing notebook via URL.
     */
    public async share(key = "ipynb") {
        const msg = $("<div>").html(`
<p>
Un lien vers la page de Basthon avec le contenu actuel du notebook a été créé.
<br>
<i class="fa fa-exclamation-circle"></i> Attention, partager un script trop long peut ne pas fonctionner avec certains navigateurs.
`);
        this._events.trigger('before_share.Notebook');
        this._share(await this.notebookToURL(key), msg);
        this._events.trigger('notebook_shared.Notebook');
    };

    /**
     * Saving notebook to local storage.
     */
    public saveToStorage() {
        this._notebook.saveToStorage();
    }

    /**
     * Download notebook to file.
     */
    public download() {
        const content = JSON.stringify(this._notebook.toJSON());
        let blob = new Blob([content], { type: "text/plain" });
        GUIBase.openURL(window.URL.createObjectURL(blob),
            this._notebook.notebook_name);
    }

    /**
     * Load a notebook.
     */
    public async openNotebook(file: File): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = async (event) => {
                /* TODO: connect filename to notebook name */
                const ipynb = event?.target?.result;
                if (ipynb != null)
                    await this._notebook.load(JSON.parse(ipynb as string));
                // notification seems useless here.
                resolve();
            };
            reader.onerror = reject;
        });
    }

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
            'ipynb': this.openNotebook.bind(this)
        });
    }
}
