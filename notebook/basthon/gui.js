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
                event, () => { that.saveToStorage(); } );
        }
    };

    /**
     * Copying a string to clipboard.
     */
    that.copyToClipboard = function (text) {
        
        var textArea = document.createElement("textarea");

        // Precautions from https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript

        // Place in top-left corner of screen regardless of scroll position.
        textArea.style.position = 'fixed';
        textArea.style.top = 0;
        textArea.style.left = 0;

        // Ensure it has a small width and height. Setting to 1px / 1em
        // doesn't work as this gives a negative w/h on some browsers.
        textArea.style.width = '2em';
        textArea.style.height = '2em';

        // We don't need padding, reducing the size if it does flash render.
        textArea.style.padding = 0;

        // Clean up any borders.
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';

        // Avoid flash of white box if rendered for any reason.
        textArea.style.background = 'transparent';


        textArea.value = text;
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
            console.log('Copying text command was ' + msg);
        } catch (err) {
            console.log('Oops, unable to copy');
        }
        
        document.body.removeChild(textArea);
    };

    /**
     * Open an URL in a new tab.
     */
    that.openURL = function (url) {
        var anchor = document.createElement("a");
        anchor.href = url;
        anchor.target ="_blank";
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
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
        const url = that.notebook.toURL(key);
        that.dialog.modal({
            notebook: that.notebook,
            keyboard_manager: that.notebook.keyboard_manager,
            title : "Partager ce notebook",
            body : msg,
            buttons : {
                "Copier dans le presse-papier": {
                    "class": "btn-primary",
                    "click": function () {
                        that.copyToClipboard(url);
                    },
                },
                "Tester le lien": {
                    "click": function () {
                        that.openURL(url);
                    },
                },
            }
        });
        that.notebook.events.trigger('notebook_shared.Notebook');
    };

    /**
     * Saving notebook to local storage.
     */
    that.saveToStorage = function () {
        that.notebook.saveToStorage();
    };

    /**
     * Download notebook to file.
     */
    that.download = function () {
        const content = JSON.stringify(that.notebook.toJSON());
        var blob = new Blob([content], { type: "text/plain" });
        var anchor = document.createElement("a");
        anchor.download = that.notebook.notebook_name;
        anchor.href = window.URL.createObjectURL(blob);
        anchor.target ="_blank";
        anchor.style.display = "none"; // just to be safe!
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    };
    
    /**
     * Load a notebook.
     */
    that.openNotebook = function (file) {
        return new Promise(function (resolve, reject) {
            var input = document.createElement('input');
            input.type = 'file';
            input.style.display = "none";
            input.onchange = async function (event) {
                for( var file of event.target.files ) {
                    const ext = file.name.split('.').pop();
                    var reader = new FileReader();
                    if(ext === 'ipynb') {
                        reader.readAsText(file);
                        reader.onload = function (event) {
                            /* TODO: connect filename to notebook name */
                            await that.notebook.load(JSON.parse(event.target.result));
                            resolve();
                        };
                    } else {
                        reader.readAsArrayBuffer(file);
                        reader.onload = function (event) {
                            await Basthon.putFile(file.name, event.target.result);
                            resolve();
                        };
                    }
                }
            }
            document.body.appendChild(input);
            input.click();
            document.body.removeChild(input);
        });
    };
    
    return that;
})();

window.basthonGUI.init();
