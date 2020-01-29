from browser import document, window, worker


kernel = worker.Worker("kernel")


def request_eval(event):
    data = event.detail
    kernel.send(dict({"msg_type": "request-eval"}, **data))


def message_manager(event):
    data = event.data
    msg_type = data["msg_type"]

    if msg_type == "eval-finished":
        event = window.CustomEvent.new(
            "basthon-kernel.eval-finished", {"detail": data})
        document.dispatchEvent(event)
    elif msg_type == "flush":
        event = window.CustomEvent.new(
            "basthon-kernel.streaming", {"detail": data})
        document.dispatchEvent(event)


document.bind("basthon-kernel.request-eval", request_eval)
kernel.bind("message", message_manager)
