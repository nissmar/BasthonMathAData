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

        document.addEventListener(
            'basthon-kernel.eval-finished',
            function (event) {
                var data = event.detail;
                
                // updating output
                if("content" in data) {
                    var output = String(data.content);
                    var msg = {
                        content: {
                            execution_count: data.execution_count,
                            data: {"text/plain": output },
                            metadata: {}
                        },
                        header: {
                            msg_type: "execute_result"
                        },
                        parent_header: { msg_id: data.parent_id },
                        channel: "iopub"
                    };
                    that._send(msg);
                }

                // finished computation signal
                var msg = {
                    content: {
                        execution_count: data.execution_count,
                        metadata: {}
                    },
                    header: {
                        msg_type: "execute_reply"
                    },
                    parent_header: { msg_id: data.parent_id },
                    channel: "shell"
                }
                that._send(msg);
            });
        
        document.addEventListener(
            'basthon-kernel.streaming',
            function (event) {
                var data = event.detail;

                var msg = {
                    content: {
                        name: data.stream,
                        text: data.content
                    },
                    header: {
                        msg_type: "stream"
                    },
                    parent_header: { msg_id: data.parent_id },
                    channel: "iopub"
                }
                that._send(msg);
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
                var event = new CustomEvent("basthon-kernel.request-eval",
                                            {"detail": {"code": code,
                                                        "parent_id": parent_id}});
                document.dispatchEvent(event);
                break;
            }
            break;
        case "iopub":
            break;
        }


        console.log("message send by BWS : ");
        console.log(msg);
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
