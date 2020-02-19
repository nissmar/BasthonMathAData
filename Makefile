all: build

clean:
	python3 setup.py clean --all
	rm -rf notebook/static/brython/ notebook/basthon/main.py notebook/basthon/kernel.py

build: clean
	mkdir -p notebook/static/brython/
	cd notebook/static/brython/ && python3 -m basthon-kernel --install && cd ../../../
	for f in main.py kernel.py; do mv notebook/static/brython/$$f notebook/basthon/; done
	python3 setup.py build
	for f in custom api/ kernelspecs/ basthon/; do cp -r notebook/$$f build/lib/notebook/; done
	mv build/lib/notebook/basthon/index.html build/lib/notebook/

test: build
	bash -c "set -m ; python3 -m http.server --directory build/lib/notebook/ --bind localhost 8888 & sleep 1 ; firefox localhost:8888 ; fg %1"

.PHONY: clean build all test
