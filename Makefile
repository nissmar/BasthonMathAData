all: build

dummy := $(shell pip3 install --upgrade basthon-kernel)
languages := $(shell python3 -m basthon-kernel --languages)

clean:
	python3 setup.py clean --all
	rm -rf notebook/static/basthon-kernel/ notebook/version notebook/static/*/js/main*.min.js

version:
	echo $$(date -d @$$(git log -1 --format="%at") +%Y/%m/%d_%H:%M:%S)_kernel_$$(pip3 show basthon-kernel | grep Version | cut -f2 -d' ') > notebook/version

_install-kernel:
	mkdir -p notebook/static/basthon-kernel/
	cd notebook/static/basthon-kernel/ && python3 -m basthon-kernel --install && cd -

install-kernel: _install-kernel version

build: clean install-kernel
	python3 setup.py build
	for f in version custom api/ kernelspecs/ examples/; do cp -r notebook/$$f build/lib/notebook/; done
	mv build/lib/notebook/ build/lib/base/
	mkdir build/lib/notebook/
	for lang in $(languages); do \
		rsync -a --delete build/lib/base/ build/lib/notebook/$$lang ; \
		python3 index_renderer.py $$lang build/lib/notebook/$$lang/index.html ; \
	done
	rsync -a build/lib/notebook/python3/ build/lib/notebook/
	rsync -a build/lib/notebook/python3/ build/lib/notebook/python/
	rsync -a build/lib/notebook/javascript/ build/lib/notebook/js/

archives:
	tar --exclude="*.htaccess" -czf basthon-notebook.tgz -C build/lib/notebook/ .
	cd build/lib/notebook/ && zip --exclude "*.htaccess" -qr ../../../basthon-notebook.zip . && cd -

test: build
	bash -c "set -m ; python3 -m http.server --directory build/lib/notebook/ --bind localhost 8888 & sleep 1 ; firefox localhost:8888 ; fg %1"

devel-publish: build
	rsync -avzP --delete build/lib/notebook/ basthon:sites_basthon/devel/notebook/

.PHONY: clean build all test install-kernel _install-kernel archives version devel-publish
