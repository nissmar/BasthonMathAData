define([], function() {
    "use strict";
    const that = { Basthon: null,
                   BasthonGoodies: null};

    that.init = async function() {
        if(that.Basthon != null)
            return;
        let kernel = null;
        switch (window.basthonLanguage) {
        case "python3":
            const { KernelPython3 } = await import("@basthon/kernel-python3");
            kernel = new KernelPython3();
            break;
        case "javascript":
            const { KernelJavaScript } = await import("@basthon/kernel-javascript");
            kernel = new KernelJavaScript();
            break;
        case "sql":
            const { KernelSQL } = await import("@basthon/kernel-sql");
            kernel = new KernelSQL();
            break;
        default:
            window.console.error(`Kernel '${language}' not supported.`);
            break;
        }
        if (kernel != null) {
            that.Basthon = kernel;
            const { BasthonGoodies } = await import("@basthon/goodies");
            that.BasthonGoodies = new BasthonGoodies(kernel);
        }
    };
    
    return that;
});

window.BASTHON_KERNEL_SCRIPT = "assets/basthon.js";
