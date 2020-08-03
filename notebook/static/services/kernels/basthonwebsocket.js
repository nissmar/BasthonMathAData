define([], function() {
    "use strict";

    var CLOSED = 0;
    var OPEN = 1;

    /**
     * A fake interface to WebSocket to simulate communication with
     * Python kernel.
     */
    var BasthonWebSocket = function(url) {
        var that = this;

        this.url = url;
        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;
        this.readyState = OPEN;

        setTimeout(function() {
            that.onopen();
        }, 500);

        Basthon.addEventListener(
            'eval.finished',
            function (data) {
                // updating output
                if("result" in data) {
                    var output = String(data.result);
                    that._send({
                        content: {
                            execution_count: data.execution_count,
                            data: {"text/plain": output },
                            metadata: {}
                        },
                        header: { msg_type: "execute_result" },
                        parent_header: { msg_id: data.parent_id },
                        channel: "iopub"
                    });
                }

                // finished computation signal
                that._send({
                    content: {
                        execution_count: data.execution_count,
                        metadata: {}
                    },
                    header: { msg_type: "execute_reply" },
                    parent_header: { msg_id: data.parent_id },
                    channel: "shell"
                });
            });

        Basthon.addEventListener(
            'eval.output',
            function (data) {
                that._send({
                    content: {
                        name: data.stream,
                        text: data.content
                    },
                    header: { msg_type: "stream" },
                    parent_header: { msg_id: data.parent_id },
                    channel: "iopub"
                });
            });

        Basthon.addEventListener(
            'eval.display',
            function (data) {
                // /!\ HACK!
                // we can't pass directly the JS object containing
                // the figure to frontend so we get it from
                // Basthon.currentEvalEventData.rootDisplay
                const id = data.parent_id + "_display";
                const script = "<script>var _ = function () { const elem = Basthon.currentEvalEventData.rootDisplay; if( !document.body.contains(elem) ) { document.getElementById('" + id + "').appendChild(elem); } }();</script>";
                that._send({
                    content: {
                        data: {"text/plain": "<IPython.core.display.HTML object>",
                               // we pass an html script to load it!
                               "text/html": "<div id='" + id + "'></div>"
                               + script},
                        metadata: {},
                        transcient: {},
                    },
                    header: { msg_type: "display_data" },
                    parent_header: { msg_id: data.parent_id },
                    channel: "iopub"
                });
            });
    };

    BasthonWebSocket.prototype._send = function (data) {
        this.onmessage({"data": JSON.stringify(data)});
    }

    BasthonWebSocket.prototype.send = function (msg) {
        msg = JSON.parse(msg);

        var header = msg.header;
        var channel = msg.channel;
        var msg_type = header.msg_type;

        switch(channel) {
        case "shell":
            switch(msg_type) {
            case "kernel_info_request":
                this._send({"header":
                            {"msg_id": "",
                             "msg_type": "status",
                             "username": "",
                             "session": "",
                             "date": "",
                             "version": ""},
                            "msg_id": "",
                            "msg_type": "status",
                            "parent_header": header,
                            "metadata": {},
                            "content": {"execution_state": "busy"},
                            "buffers": [],
                            "channel": "iopub"});
                this._send({"header":
                            {"msg_id": "",
                             "msg_type": "status",
                             "username": "",
                             "session": "",
                             "date": "",
                             "version": ""},
                            "msg_id": "",
                            "msg_type": "status",
                            "parent_header": header,
                            "metadata": {},
                            "content": {"execution_state": "idle"},
                            "buffers": [],
                            "channel": "iopub"});
                this._send({"header":
                            {"msg_id": "",
                             "msg_type": "kernel_info_reply",
                             "username": "",
                             "session": "",
                             "date": "",
                             "version": ""},
                            "msg_id": "",
                            "msg_type": "kernel_info_reply",
                            "parent_header": header,
                            "metadata": {},
                            "content": {"status": "ok"},
                            "buffers": [],
                            "channel": "shell"});
                break;
            case "execute_request":
                var code = msg.content.code;
                var parent_id = header.msg_id;
                Basthon.dispatchEvent("eval.request",
                                      {"code": code,
                                       "parent_id": parent_id});
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
