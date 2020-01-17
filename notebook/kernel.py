from browser import window, console

_credits = """    Thanks to CWI, CNRI, BeOpen.com, Zope Corporation and a cast of thousands for supporting Python development.  See www.python.org for more information."""

_copyright = """Copyright (c) 2012, Pierre Quentel pierre.quentel@gmail.com
All Rights Reserved.

Copyright (c) 2001-2013 Python Software Foundation.
All Rights Reserved.

Copyright (c) 2000 BeOpen.com.
All Rights Reserved.

Copyright (c) 1995-2001 Corporation for National Research Initiatives.
All Rights Reserved.

Copyright (c) 1991-1995 Stichting Mathematisch Centrum, Amsterdam.
All Rights Reserved."""

_license = """Copyright (c) 2012, Pierre Quentel pierre.quentel@gmail.com
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of the <ORGANIZATION> nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
"""

def credits():
    print(_credits)


credits.__repr__ = lambda: _credits


def copyright():
    print(_copyright)


copyright.__repr__ = lambda: _copyright


def license():
    print(_license)


license.__repr__ = lambda: _license


class Kernel(object):
    def __init__(self):
        self._namespace = {
            'credits': credits,
            'copyright': copyright,
            'license': license,
            '__name__': '__main__',
            '_': ''}

    def restart(self):
        raise NotImplementedError

    def pyeval(self, code):
        try:
            _ = eval(code, self._namespace)
            if _ is not None:
                self._namespace['_'] = _
                return repr(_)
        except:
            console.log("Basthon fixme: print Python traceback")


window.kernel = Kernel()
