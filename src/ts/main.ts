// JS
import * as jQuery from "jquery";

declare global {
    interface Window {
        jQuery?: any;
        requirejs: any;
    }
}

window.jQuery = jQuery;

//import { } from "mathjax/MathJax.js?config=TeX-AMS-MML_HTMLorMML-full,Safe&delayStartupUntil=configured";
import "text-encoding/lib/encoding";
import "es6-promise/dist/promise-1.0.0";
import "react/cjs/react.production.min";
import "react-dom/cjs/react-dom.production.min";
import "create-react-class/index";

import "requirejs/require";
// @ts-ignore
//window.requirejs = requirejs;


import "../js/notebook/js/main";

// CSS
import "../css/style.less";
import "../css/ipython.less";
import "../css/override.css";
import "jquery-ui-themes/themes/smoothness/jquery-ui.min.css";
import "jquery-typeahead/dist/jquery.typeahead.min.css";
import "bootstrap-tour/build/css/bootstrap-tour.min.css";
import "codemirror/lib/codemirror.css";
