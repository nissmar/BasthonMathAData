all: build

clean:
	python3 setup.py clean --all

build: clean
	python3 setup.py build
	for f in custom api/ kernelspecs/ basthon/; do cp -r notebook/$$f build/lib/notebook/; done
	mv build/lib/notebook/basthon/index.html build/lib/notebook/

test: build
	python3 -m http.server --directory build/lib/notebook/ --bind localhost 8888

.PHONY: clean build all test
