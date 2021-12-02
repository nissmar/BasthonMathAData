// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Module to handle i18n ( Internationalization ) and translated UI

define([
    'jed'
], function(Jed) {
    "use strict";
    
    const translations = require("i18n/fr_FR/LC_MESSAGES/nbjs.po");
    var i18n = new Jed(translations);
    i18n._ = i18n.gettext;
    i18n.msg = i18n; // Just a place holder until the init promise resolves.

    return i18n;
});
