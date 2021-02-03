define(["basthon-kernel/basthon"], function(Basthon) {
    "use strict";

    let CLOSED = 0;
    let OPEN = 1;

    /**
     * DOM node variable exchanger (Bus) to bypass stringifying
     * messages between frontend and kernel that prevents DOMNode sharing.
     */
    let domNodeBus = window.domNodeBus = (function() {
        let that = {};

        /**
         * The actual bus is a dict.
         */
        that._bus = {};

        /**
         * Pushing a variable to the bus and getting an id to pop it.
         */
        that.push = function (obj) {
            let id = 0;
            for( ; id < that._bus.length; id++) {
                if( !(id in that._bus) ) {
                    break;
                }
            }
            that._bus[id] = obj;
            return id;
        };

        /**
         * Removing a variable from the bus from its id.
         */
        that.pop = function (id) {
            const res = that._bus[id];
            delete that._bus[id];
            return res;
        };

        return that;
    })();

    /**
     * Evaluation queue (FIFO).
     */
    let EvalQueue = function (ws) {
        let that = { ws: ws };

        /**
         * The queue.
         */
        that._queue = [];

        /**
         * Ready state.
         */
        that.ready = true;

        /**
         * Pushing an eval to the queue.
         */
        that.push = function (data) {
            that._queue.push(data);
            if( that.ready ) {
                that.popAndRun();
            }
            return data;
        };

        /**
         * Poping an eval from the queue.
         */
        that.pop = function () {
            return that._queue.shift();
        };

        /**
         * Pop data and run it.
         */
        that.popAndRun = function () {
            const data = that.pop();
            if( data ) {
                that.ready = false;
                ws._send_busy(data.parent_msg);
                ws._send(ws._format_msg(
                    data.parent_msg, "execute_input",
                    {code: data.code,
                     execution_count: data.execution_cout}, "iopub"));
                // this should fix the output mess when running all cells
                // at a time
                window.setTimeout(() => {
                    Basthon.dispatchEvent("eval.request", data); }, 1);
            } else {
                that.ready = true;
            }
            return data;
        };

        return that;
    };

    /**
     * A fake interface to WebSocket to simulate communication with
     * Python kernel.
     */
    let BasthonWebSocket = function(url) {
        let that = this;

        this.url = url;
        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;
        this.readyState = OPEN;
        this.message_count = 0;
        this.eval_queue = new EvalQueue(this);

        setTimeout(function() {
            that.onopen();
        }, 500);

        /* send finished signal to kernel and run next eval */
        function send_finished_and_continue(data) {
            const parent = data.parent_msg;
            that._send_idle(parent);
            that._send(that._format_msg(
                parent, "execute_reply", {
                    execution_count: data.execution_count,
                    metadata: {}
                }, "shell"));

            that.eval_queue.popAndRun();
        }

        Basthon.addEventListener(
            'eval.finished',
            function (data) {
                // updating output
                if("result" in data) {
                    that._send(that._format_msg(
                        data.parent_msg, "execute_result", {
                        execution_count: data.execution_count,
                        data: data.result,
                        metadata: {}
                    }, "iopub"));
                }

                send_finished_and_continue(data);
            });

        Basthon.addEventListener('eval.error', send_finished_and_continue);

        Basthon.addEventListener(
            'eval.output',
            function (data) {
                that._send(that._format_msg(data.parent_msg, "stream", {
                    name: data.stream,
                    text: data.content
                }, "iopub"));
            });

        Basthon.addEventListener(
            'eval.display',
            function (data) {
                /* see outputarea.js to understand interaction */
                let send_data;
                switch( data.display_type ) {
                case "html":
                    send_data = { "text/html": data.content };
                    break;
                case "sympy":
                    send_data = { "text/latex": data.content };
                    break;
                case "turtle":
                    const root = data.content;
                    root.setAttribute('width', '480px');
                    root.setAttribute('height', '360px');
                    send_data = { "image/svg+xml": root.outerHTML };
                    break;
                case "matplotlib":
                case "p5":
                    /* /!\ big hack /!\
                       To allow javascript loading of DOM node,
                       we get an id identifying the object. We can then
                       pickup the object from its id.
                     */
                    const id = domNodeBus.push(data.content);
                    send_data = { "application/javascript": "element.append(window.domNodeBus.pop(" + id + "));" };
                    break;
                case "multiple":
                    /* typically dispached by display() */
                    send_data = data.content;
                    break;
                default:
                    console.error("Not recognized display_type: " + data.display_type);
                }

                that._send(that._format_msg(data.parent_msg, "display_data", {
                    data: send_data,
                    metadata: {},
                    transcient: {},
                }, "iopub"));
            });
    };

    BasthonWebSocket.prototype._send = function (data) {
        this.onmessage({"data": JSON.stringify(data)});
    };

    BasthonWebSocket.prototype._format_msg = function (parent, msg_type, content, channel) {
        const parent_header = parent.header || {};
        const session_id = parent_header.session | "";
        const msg_id = session_id + "_" + String(this.message_count);
        this.message_count++;
        const username = parent_header.username || "username";
        const date = new Date().toISOString();
        const version = parent_header.version || "5.2";
        channel = channel || parent.channel;

        return {"header":
                {"msg_id": msg_id,
                 "msg_type": msg_type,
                 "username": username,
                 "session": session_id,
                 "date": date,
                 "version": version},
                "msg_id": msg_id,
                "msg_type": msg_type,
                "parent_header": parent_header,
                "metadata": {},
                "content": content,
                "buffers": [],
                "channel": channel};
    };

    BasthonWebSocket.prototype._send_busy = function (parent) {
        const msg = this._format_msg(parent, "status",
                                     {execution_state: "busy"},
                                     "iopub");
        this._send(msg);
    };

    BasthonWebSocket.prototype._send_idle = function (parent) {
        const msg = this._format_msg(parent, "status",
                                     {execution_state: "idle"},
                                     "iopub");
        this._send(msg);
    };

    BasthonWebSocket.prototype.send = function (msg) {
        msg = JSON.parse(msg);

        let header = msg.header;
        let channel = msg.channel;
        let msg_type = header.msg_type;

        switch(channel) {
        case "shell":
            switch(msg_type) {
            case "kernel_info_request":
                this._send_busy(msg);
                this._send_idle(msg);
                this._send(this._format_msg(msg, "kernel_info_reply",
                                            {"status": "ok"}));
                break;
            case "execute_request":
                let code = msg.content.code;
                this.eval_queue.push({"code": code, "parent_msg": msg});
                break;
            case "complete_request":
                this._send_busy(msg);
                const src = msg.content.code.slice(0, msg.content.cursor_pos);
                let completions = Basthon.complete(src);
                const cursor_start = completions[1];
                completions = completions[0];
                this._send_busy(msg);
                this._send(this._format_msg(
                    msg, "complete_reply",
                    {
                        status: 'ok',
                        matches: completions,
                        cursor_start: cursor_start,
                        // explicitly set to null as it will be
                        // dynamically computed from completer.js
                        // (this fix: math.s<tab>q<tab> badly completed)
                        cursor_end: null,
                    }));
                this._send_idle(msg);
                break;
            }
            break;
        case "iopub":
            break;
        }
    };

    BasthonWebSocket.prototype.close = function () {
        if( this.onclose ) {
            this.onclose();
        }
    };

    return {'BasthonWebSocket': BasthonWebSocket,
            'BasthonWebSocket.CLOSED': CLOSED,
            'BasthonWebSocket.OPEN': OPEN};

});
