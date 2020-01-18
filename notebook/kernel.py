from browser import window, console


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

    def pyeval(self, code):
        self.execution_count += 1
        self.roll_in_history(code)

        try:
            _ = eval(code, self._namespace)
        except:
            console.log("Basthon fixme: print Python traceback")
            console.log(self._namespace)
        else:
            self.roll_out_history(_)
            if _ is not None:
                return repr(_)


window.kernel = Kernel()
