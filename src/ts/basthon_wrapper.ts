import { KernelBase } from "@basthon/kernel-base";
import { BasthonGoodies } from "@basthon/goodies";


class BasthonWrapper {
    private _kernel: KernelBase | null = null;
    private _goodies: BasthonGoodies | null = null;
    private _language: string | undefined = window.basthonLanguage;

    public constructor() { }

    /**
     * Initialize the wrapper (building kernel).
     */
    public async init(): Promise<void> {
        if (this._kernel != null)
            return;
        switch (this._language) {
            case "python3":
                const { KernelPython3 } = await import("@basthon/kernel-python3");
                this._kernel = new KernelPython3();
                break;
            case "javascript":
                const { KernelJavaScript } = await import("@basthon/kernel-javascript");
                this._kernel = new KernelJavaScript();
                break;
            case "sql":
                const { KernelSQL } = await import("@basthon/kernel-sql");
                this._kernel = new KernelSQL();
                break;
            default:
                window.console.error(`Kernel '${this._language}' not supported.`);
                break;
        }
        if (this._kernel != null)
            this._goodies = new BasthonGoodies(this._kernel);
    };

    public get kernel() { return this._kernel; }
    public get goodies() { return this._goodies; }
}

window.BASTHON_KERNEL_SCRIPT = "assets/basthon.js";

export default new BasthonWrapper();
