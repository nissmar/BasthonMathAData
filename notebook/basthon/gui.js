"use strict";

/**
 * Callback for Basthon loading.
 */
function onLoad() {
    const notebook = Jupyter.notebook;
    // avoiding notebook loading failure.
    if( !notebook ) {
        location.reload();
    }
    /*
      loading content from query string or from local storage.
      if global variale basthonEmptyNotebook is set to true,
      we open a new notebook
      (see kernelselector.js).
     */
    if( !window.basthonEmptyNotebook && !notebook.loadFromQS() ) {
        notebook.loadFromStorage();
    }

    /* saving to storage on multiple events */
    function saveCallback() { notebook.saveToStorage(); }
    for( let event of ['execute.CodeCell',
                       'finished_execute.CodeCell',
                       'output_added.OutputArea',
                       'output_updated.OutputArea',
                       'output_appended.OutputArea'] ) {
        notebook.events.bind(event, saveCallback);
    }
}

Basthon.Goodies.showLoader("Chargement de Basthon-Notebook...").then(onLoad);
