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
 *  Get QS from curent URL.
 */
function queryString() {
    var search = window.location.search;
    if( search[0] === '?' ) { search = search.substr(1); }
    var query = {};
    for( let param of search.split('&') ) {
        const pair = param.split("=");
        query[pair[0]] = decodeURIComponent(pair[1]);
    }
    return query;
}

/**
 * Callback for Basthon loading.
 */
function onLoad() {
    /* loading content from query string or from local storage */
    const params = queryString();
    if( "ipynb" in params ) {
        loadNotebook(JSON.parse(params.ipynb));
    } else {
        loadFromStorage();
    }
    
    /* saving to storage on multiple events */
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
