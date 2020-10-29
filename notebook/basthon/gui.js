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

        // keeping back dialog module from notebook.
        that.dialog = that.notebook.dialog;
        
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

    /**
     * Sharing notebook via URL.
     */
    that.share = function (key="ipynb") {
        const msg = $("<div>").html(`
<p>
Un lien vers la page de Basthon avec le contenu actuel du script a été créé.
<br>
<i class="fa fa-exclamation-circle"></i> Attention, partager un script trop long peut ne pas fonctionner avec certains navigateurs.
`);
        that.notebook.events.trigger('before_share.Notebook');
        that.dialog.modal({
            notebook: that.notebook,
            keyboard_manager: that.notebook.keyboard_manager,
            title : "Partager ce notebook",
            body : msg,
            buttons : {
                "Copier dans le presse-papier": {
                    "class": "btn-primary",
                    "click": function () {
                        that.notebook._copyContentAsURL(key);
                    },
                },
                "Tester le lien": {
                    "click": function () {
                        const url = that.notebook.toURL(key);
                        var anchor = document.createElement("a");
                        anchor.href = url;
                        anchor.target ="_blank";
                        anchor.style.display = "none";
                        document.body.appendChild(anchor);
                        anchor.click();
                        document.body.removeChild(anchor);
                    },
                },
            }
        });
        that.notebook.events.trigger('notebook_shared.Notebook');
    };
    
    return that;
})();

window.basthonGUI.init();
