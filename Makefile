all: build

clean:
	python3 setup.py clean --all

build: clean
	python3 setup.py build
	for f in index.html custom api/; do cp -r notebook/$$f build/lib/notebook/; done

test: build
	python3 -m http.server --directory build/lib/notebook/ --bind localhost 8888

.PHONY: clean build all test
