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
<i class="fa fa-copy"></i>
Un lien vers la page de Basthon avec le contenu actuel du notebook
a été copié dans le presse-papier.
<p>
Vous pouvez le coller où vous voulez pour partager votre notebook.
<p>
<i class="fa fa-exclamation-circle"></i>
Attention, partager un notebook de taille trop importante peut ne
pas fonctionner avec certains navigateurs.
`);
        that.notebook.events.trigger('before_share.Notebook');
        that.notebook._copyContentAsURL(key);
        that.dialog.modal({
            notebook: that.notebook,
            keyboard_manager: that.notebook.keyboard_manager,
            title : i18n.msg._("Un lien vers ce notebook a été copié"),
            body : msg,
            buttons : {
                OK : {
                    "class" : "btn-primary"
                }
            }
        });
        that.notebook.events.trigger('notebook_shared.Notebook');
    };
    
    return that;
})();

window.basthonGUI.init();
