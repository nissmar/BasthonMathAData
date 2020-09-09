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
 * Save notebook to local storage.
 */
function saveToStorage() {
    if (typeof(Storage) !== "undefined") {
        console.log("Saving notebook to local storage");
        window.localStorage.setItem("ipynb", JSON.stringify(Jupyter.notebook.toIpynb()));
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
    // saving to storage on multiple events
    const events = Jupyter.notebook.events;
    for( let event of ['execute.CodeCell',
                       'finished_execute.CodeCell',
                       'output_added.OutputArea',
                       'output_updated.OutputArea',
                       'output_appended.OutputArea'] ) {
        events.bind(event, saveToStorage);
    }
}

Basthon.Goodies.showLoader("Chargement de Basthon-Notebook...").then(onLoad);
