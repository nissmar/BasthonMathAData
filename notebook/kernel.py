from browser import window, console
import sys
import tb as traceback


class StreamManager(object):
    def __init__(self, std, func):
        self.std = std
        self.func = func
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
        self.func(self.buff)
        self.buff = ""

    def close(self):
        self.flush()
        self.std.write = self.write_bck
        self.std.flush = self.flush_bck


def syntax_error(args):
    info, filename, lineno, offset, line = args
    sys.stderr.write(f"  File {filename}, line {lineno}\n")
    sys.stderr.write("    " + line + "\n")
    sys.stderr.write("    " + offset * " " + "^\n")
    sys.stderr.write("SyntaxError: " + info + "\n")


class Kernel(object):
    def __init__(self):
        self.start()

    def start(self):
        self._namespace = {
            '__name__': '__main__',
            '_': '',
            '__': '',
            '___': '',
            'In': [''],
            'Out': {}}
        self.execution_count = 0

    def stop(self):
        pass

    def restart(self):
        self.stop()
        self.start()

    def roll_in_history(self, code):
        self._namespace['In'].append(code)

    def roll_out_history(self, out):
        outputs = self._namespace['Out']
        # out is not always stored
        if out is not None and out != outputs:
            outputs[self.execution_count] = out
            self._namespace['___'] = self._namespace['__']
            self._namespace['__'] = self._namespace['_']
            self._namespace['_'] = out

    # switching to exec when eval fails
    def _eval(self, code):
        try:
            return eval(code, self._namespace)
        except SyntaxError as error:
            if str(error) == 'eval() argument must be an expression':
                return exec(code, self._namespace)
            else:
                raise

    def pyeval(self, code, stdout, stderr):
        self.execution_count += 1
        self.roll_in_history(code)

        stdout_manager = StreamManager(sys.stdout, stdout)
        stderr_manager = StreamManager(sys.stderr, stderr)

        try:
            _ = self._eval(code)
        except SyntaxError as error:
            syntax_error(error.args)
        except:
            traceback.print_exc(file=sys.stderr)
        else:
            self.roll_out_history(_)
            if _ is not None:
                return repr(_)
        finally:
            stdout_manager.close()
            stderr_manager.close()


window.kernel = Kernel()
