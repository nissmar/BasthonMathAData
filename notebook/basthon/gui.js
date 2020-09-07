"use strict";

/**
 * Loading notebook from ipynb JSON (plus path and name).
 */
function loadNotebook(data) {
    if( data.content === undefined ) {
        data = {content: data};
    }
    data.path = data.path || "Untitled.ipynb";
    data.name = data.name || "Untitled.ipynb";
    Jupyter.notebook.fromJSON(data);
}

/**
 * Dumping notebook to JSON (plus path and name).
 */
function notebookToIpynb() {
    const notebook = Jupyter.notebook;
    return {path: notebook.notebook_path,
            name: notebook.notebook_name,
            content: notebook.toJSON()};
}

/**
 * Save notebook to local storage.
 */
function saveToStorage() {
    if (typeof(Storage) !== "undefined") {
        console.log("Saving notebook to local storage");
        window.localStorage.setItem("ipynb", JSON.stringify(notebookToIpynb()));
    } else {
        console.warn("Local storage not supported");
    }
}

/**
 * Loading notebook from local storage.
 */
function loadFromStorage() {
    if (typeof(Storage) !== "undefined") {
        const json = window.localStorage.getItem("ipynb");
        if( json ) {
            loadNotebook(JSON.parse(json));
        }
    } else {
        console.warn("Local storage not supported");
    }
    
}

/**
 * Callback for Basthon loading.
 */
function onLoad() {
    loadFromStorage();
    // saving to storage on eval
    Basthon.addEventListener('eval.request', saveToStorage);
}

Basthon.Goodies.showLoader("Chargement de Basthon-Notebook...").then(onLoad);
