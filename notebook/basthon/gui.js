"use strict";

/**
 * Basthon part of the notebook GUI.
 */
window.basthonGUI = (function () {
    var that = {};

    /**
     * Initialise the GUI (Basthon part).
     */
    that.init = async function () {
        await Basthon.Goodies.showLoader("Chargement de Basthon-Notebook...");

        that.notebook = Jupyter.notebook;
        // avoiding notebook loading failure.
        if( !that.notebook ) {
            location.reload();
        }
        
        /*
          loading content from query string or from local storage.
          if global variale basthonEmptyNotebook is set to true,
          we open a new notebook
          (see kernelselector.js).
        */
        if( !window.basthonEmptyNotebook && !that.notebook.loadFromQS() ) {
            that.notebook.loadFromStorage();
        }
        
        /* saving to storage on multiple events */
        for( let event of ['execute.CodeCell',
                           'finished_execute.CodeCell',
                           'output_added.OutputArea',
                           'output_updated.OutputArea',
                           'output_appended.OutputArea'] ) {
            that.notebook.events.bind(
                event, () => { that.notebook.saveToStorage(); } );
        }
    };
    
    return that;
})();

window.basthonGUI.init();
