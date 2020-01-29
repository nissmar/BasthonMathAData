from browser import document, window, worker


kernel = worker.Worker("kernel")


def request_eval(event):
    data = event.detail
    kernel.send({"msg_type": "eval",
                 "code": data["code"]})


def message_manager(event):
    data = event.data
    msg_type = data["msg_type"]

    if msg_type == "output":
        event = window.CustomEvent.new(
            "basthon-kernel.output",
            {"detail": {"content": data["content"]}})
        document.dispatchEvent(event)
    elif msg_type == "flush":
        event = window.CustomEvent.new(
            "basthon-kernel.streaming",
            {"detail": {"stream": data["stream"],
                        "content": data["content"]}})
        document.dispatchEvent(event)


document.bind("basthon-kernel.request-eval", request_eval)
kernel.bind("message", message_manager)
