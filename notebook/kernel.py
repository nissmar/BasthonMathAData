from browser import bind
from browser import self as this  # avoid conflict with self in classes
import sys
import tb as traceback


def syntax_error(args):
    info, filename, lineno, offset, line = args
    sys.stderr.write(f"  File {filename}, line {lineno}\n")
    sys.stderr.write("    " + line + "\n")
    sys.stderr.write("    " + offset * " " + "^\n")
    sys.stderr.write("SyntaxError: " + info + "\n")


class StreamManager(object):
    """
    A class to catch stderr/stdout input during eval.
    """
    def __init__(self, stream):
        self.stream = stream
        std = getattr(sys, stream)
        self.std = std
        self.buff = ""
        self.write_bck = std.write
        self.flush_bck = std.flush
        std.write = self.write
        std.flush = self.flush

    def __del__(self):
        self.close()

    def write(self, data):
        self.buff += data
        return len(data)

    def flush(self):
        if not self.buff:
            return
        this.send({"msg_type": "flush",
                   "stream": self.stream,
                   "parent_id": parent_id,
                   "content": self.buff})
        self.buff = ""

    def close(self):
        self.flush()
        self.std.write = self.write_bck
        self.std.flush = self.flush_bck


def start():
    global execution_count, _namespace

    execution_count = 0
    _namespace = {
        '__name__': '__main__',
        '_': '',
        '__': '',
        '___': '',
        'In': [''],
        'Out': {}
    }


def stop():
    pass


def restart():
    stop()
    start()


def roll_in_history(code):
    """ Manage storing in In ala IPython. """
    _namespace['In'].append(code)


def roll_out_history(out):
    """ Manage storing in Out, _, __, ___ ala IPython. """
    outputs = _namespace['Out']
    # out is not always stored
    if out is not None and out != outputs:
        outputs[execution_count] = out
        _namespace['___'] = _namespace['__']
        _namespace['__'] = _namespace['_']
        _namespace['_'] = out


def _internal_eval(code):
    """ Kernel function to manage use of eval/exec. """
    try:
        return eval(code, _namespace)
    except SyntaxError as error:
        if str(error) == 'eval() argument must be an expression':
            return exec(code, _namespace)
        else:
            raise


def pyeval(code):
    """ Evaluation of Python code with communication managment
    with main script and stdout/stderr catching. """
    global execution_count

    execution_count += 1
    roll_in_history(code)

    stdout_manager = StreamManager("stdout")
    stderr_manager = StreamManager("stderr")

    try:
        _ = _internal_eval(code)
    except SyntaxError as error:
        syntax_error(error.args)
    except:
        traceback.print_exc(file=sys.stderr)
    else:
        roll_out_history(_)
        if _ is not None:
            return repr(_)
    finally:
        stdout_manager.close()
        stderr_manager.close()


@bind(this, "message")
def message_manager(event):
    """ Communication with Brython's main script, main.py. """
    global parent_id
    data = event.data
    parent_id = data["parent_id"]
    msg_type = data["msg_type"]
    if msg_type == "request-eval":
        code = data['code']
        output = pyeval(code)
        msg = {"msg_type": "eval-finished",
               "execution_count": execution_count,
               "parent_id": parent_id}
        if output is not None:
            msg["content"] = output
        this.send(msg)


execution_count, _namespace, parent_id = [None] * 3

start()
