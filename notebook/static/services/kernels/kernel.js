


define([
    'jquery',
    'base/js/utils',
    './comm',
    './serialize',
    'base/js/events'
], function($, utils, comm, serialize, events) {
    "use strict";

    var Kernel = function (kernel_service_url, ws_url, name) {
        this.events = events;
        
        this.id = null;
        this.name = name;
        this.ws = null;
        this._stopping = false;

        this.kernel_service_url = kernel_service_url;
        this.kernel_url = null;
        this.ws_url = ws_url || utils.get_body_data("wsUrl");
        if (!this.ws_url) {
            // trailing 's' in https will become wss for secure web sockets
            this.ws_url = location.protocol.replace('http', 'ws') + "//" + location.host;
        }

        this.username = "username";
        this.session_id = utils.uuid();
        this._msg_callbacks = {};
        this._msg_callbacks_overrides = {};
        this._display_id_to_parent_ids = {};
        this._msg_queue = Promise.resolve();
        this.info_reply = {}; // kernel_info_reply stored here after starting

        this.execution_count = 0;

        if (typeof(WebSocket) !== 'undefined') {
            this.WebSocket = WebSocket;
        } else if (typeof(MozWebSocket) !== 'undefined') {
            this.WebSocket = MozWebSocket;
        } else {
            alert('Your browser does not have WebSocket support, please try Chrome, Safari or Firefox ≥ 6. Firefox 4 and 5 are also supported by you have to enable WebSockets in about:config.');
        }
        
        this.bind_events();
        this.init_iopub_handlers();
        this.comm_manager = null;
        
        this.last_msg_id = null;
        this.last_msg_callbacks = {};

        this._autorestart_attempt = 0;
        this._reconnect_attempt = 0;
        this.reconnect_limit = 7;
        
        this._pending_messages = [];
    };
    
    Kernel.prototype.bind_events = function () {
        var that = this;
        this.events.on('send_input_reply.Kernel', function(evt, data) { 
            that.send_input_reply(data);
        });

        var record_status = function (evt, info) {
            console.log('Kernel: ' + evt.type + ' (' + info.kernel.id + ')');
        };

        this.events.on('kernel_created.Kernel', record_status);
        this.events.on('kernel_reconnecting.Kernel', record_status);
        this.events.on('kernel_connected.Kernel', record_status);
        this.events.on('kernel_starting.Kernel', record_status);
        this.events.on('kernel_restarting.Kernel', record_status);
        this.events.on('kernel_autorestarting.Kernel', record_status);
        this.events.on('kernel_interrupting.Kernel', record_status);
        this.events.on('kernel_disconnected.Kernel', record_status);
        // these are commented out because they are triggered a lot, but can
        // be uncommented for debugging purposes
        //this.events.on('kernel_idle.Kernel', record_status);
        //this.events.on('kernel_busy.Kernel', record_status);
        this.events.on('kernel_ready.Kernel', record_status);
        this.events.on('kernel_killed.Kernel', record_status);
        this.events.on('kernel_dead.Kernel', record_status);

        this.events.on('kernel_ready.Kernel', function () {
            that._autorestart_attempt = 0;
        });
        this.events.on('kernel_connected.Kernel', function () {
            that._reconnect_attempt = 0;
        });
    };

    Kernel.prototype.init_iopub_handlers = function () {};

    Kernel.prototype.list = function (success, error) {};

    Kernel.prototype.start = function (params, success, error) {
        this.events.trigger('kernel_starting.Kernel', {kernel: this});
        this._kernel_created();
    };

    Kernel.prototype._kernel_created = function (data) {
        this.events.trigger('kernel_created.Kernel', {kernel: this});
        this.execution_count = 0;
        this._kernel_connected();
    };
    
    Kernel.prototype._kernel_connected = function () {
        this.events.trigger('kernel_connected.Kernel', {kernel: this});
        this.events.trigger('kernel_ready.Kernel', {kernel: this});
    }
    
    Kernel.prototype._kernel_dead = function () {};
    
    Kernel.prototype.get_info = function (success, error) {};

    Kernel.prototype.kill = function (success, error) {
        this.events.trigger('kernel_killed.Kernel', {kernel: this});
    };

    Kernel.prototype.interrupt = function (success, error) {
        this.events.trigger('kernel_interrupting.Kernel', {kernel: this});
    };

    Kernel.prototype.restart = function (success, error) {
        this.events.trigger('kernel_restarting.Kernel', {kernel: this});
        this.events.trigger('kernel_created.Kernel', {kernel: this});
    };

    Kernel.prototype.reconnect = function () {
        this.events.trigger('kernel_reconnecting.Kernel', {
            kernel: this,
            attempt: this._reconnect_attempt,
        });
        this.events.trigger('kernel_connected.Kernel', {kernel: this});
    };

    Kernel.prototype.start_channels = function () {};

    Kernel.prototype.stop_channels = function () {};

    Kernel.prototype.is_connected = function () { return true; };

    Kernel.prototype.is_fully_disconnected = function () { return true; };

    Kernel.prototype.send_shell_message = function (msg_type, content, callbacks, metadata, buffers) {};

    Kernel.prototype.kernel_info = function (callback) {};

    Kernel.prototype.comm_info = function (target_name, callback) {};

    Kernel.prototype.inspect = function (code, cursor_pos, callback) {};

    Kernel.prototype.execute = function (code, callbacks, options) {
        //this.events.trigger('kernel_busy.Kernel', {kernel: this});

        this.events.trigger('execution_request.Kernel', {kernel: this});

        this.execution_count++;

        // see https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string
        var replaceAll = function(str, sub, newsub) { return str.split(sub).join(newsub); };
        // Used to avoid conflicts between Python and JS quotes.
        var stringify = function(str) { return "'" + replaceAll(str, "'", "\\'") + "'"; };
        /*
          Brython issue #690 advises to use window to share global variables.
          See : https://github.com/brython-dev/brython/issues/690
        */
        code = "from browser import window ; window._basthon_underscore = repr(eval(" + stringify(code) + "))";

        /*
          Brython issue #937 advises to use python_to_js in that case.
          See https://github.com/brython-dev/brython/issues/937
         */
        var js_code = __BRYTHON__.python_to_js( {src: code, has_annotations: false} );
        /* Fix me: why is there some strange "None;;" in the js code? */
        js_code = replaceAll(js_code, "None;;", "");
        console.log(js_code);
        eval(js_code);

        var output = window._basthon_underscore;

        var msg = {
            content: {
                execution_count: this.execution_count,
                data: {"text/plain": String(output) },
                metadata: {}
            },
            header: {
                msg_type: "execute_result"
            }
        };

        if(callbacks.shell && callbacks.shell.reply) {
            callbacks.shell.reply(msg);
        }

        if(callbacks.iopub && callbacks.iopub.output) {
            callbacks.iopub.output(msg);
        }
        return 0;
    };

    Kernel.prototype.complete = function (code, cursor_pos, callback) {};

    Kernel.prototype.send_input_reply = function (input) {};

    Kernel.prototype.register_iopub_handler = function (msg_type, callback) {};

    Kernel.prototype.get_iopub_handler = function (msg_type) {};

    Kernel.prototype.get_callbacks_for_msg = function (msg_id) {};

    Kernel.prototype.get_output_callbacks_for_msg = function (msg_id) {};

    Kernel.prototype.get_output_callback_id = function (msg_id) {};

    Kernel.prototype.clear_callbacks_for_msg = function (msg_id) {};

    Kernel.prototype.set_callbacks_for_msg = function (msg_id, callbacks, save) {};

    Kernel.prototype.output_callback_overrides_push = function(msg_id, callback_id) {};

    Kernel.prototype.output_callback_overrides_pop = function(msg_id) {};
    return {'Kernel': Kernel};
});
