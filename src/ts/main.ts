// JS
import * as jQuery from "jquery";
import "jquery-ui-bundle";

declare global {
    interface Window {
        jQuery?: any;
        requirejs: any;
    }
}

window.jQuery = jQuery;

//import { } from "mathjax/MathJax.js?config=TeX-AMS-MML_HTMLorMML-full,Safe&delayStartupUntil=configured";
/*import * as es6_promise from "es6-promise/dist/promise-1.0.0";
import * as react from "react/cjs/react.production.min";
import * as react_dom from "react-dom/cjs/react-dom.production.min";
import * as create_react_class from "create-react-class/create-react-class.min";

console.log(es6_promise);
console.log(react);
console.log(react_dom);
console.log(create_react_class);

// @ts-ignore
window.createReactClass = create_react_class;

import "requirejs/require";
// @ts-ignore
//window.requirejs = requirejs;

import "text-encoding/lib/encoding";
*/

import "../js/notebook/js/main";

// CSS
import "../css/style.less";
import "../css/ipython.less";
import "../css/override.css";
import "jquery-ui-themes/themes/smoothness/jquery-ui.min.css";
import "jquery-typeahead/dist/jquery.typeahead.min.css";
import "bootstrap-tour/build/css/bootstrap-tour.min.css";
import "codemirror/lib/codemirror.css";
