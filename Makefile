all: build

dummy := $(shell pip3 install --force-reinstall basthon-kernel==0.33.0)
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

define rsynclite
	mkdir -p $(2) ; \
	for f in $$(find $$(realpath $(1)) -mindepth 1 -maxdepth 1); do \
		ln -s $$f $(2) ; \
	done ; \
	rm $(2)/api ; \
	mkdir $(2)/api ; \
	for f in $$(find $$(realpath $(1)/api) -mindepth 1 -maxdepth 1); do \
		ln -s $$f $(2)/api ; \
	done ; \
	rm $(2)/api/contents ; \
	mkdir $(2)/api/contents
endef

build: clean install-kernel
	rm -rf build/lib/
	python3 setup.py build
	for f in version custom api/ kernelspecs/ examples/; do cp -r notebook/$$f build/lib/notebook/; done
	# symlinks apps for each languages
	for lang in $(languages); do \
		$(call rsynclite,build/lib/notebook/,build/lib/$$lang) ; \
		python3 basthon_renderer.py $$lang build/lib/$$lang/ ; \
	done
	# making links relatives
	for lang in $(languages); do \
		mv build/lib/$$lang build/lib/notebook/ ; \
		symlinks -rc $$(realpath build/lib/notebook/$$lang) ; \
	done
	python3 basthon_renderer.py python3 build/lib/notebook/
	ln -s python3 build/lib/notebook/python
	ln -s javascript build/lib/notebook/js

archives:
	tar --exclude="*.htaccess" -czf basthon-notebook.tgz -C build/lib/notebook/ .
	cd build/lib/notebook/ && zip --exclude "*.htaccess" -qr ../../../basthon-notebook.zip . && cd -

test: build
	bash -c "set -m ; python3 -m http.server --directory build/lib/notebook/ --bind localhost 8888 & sleep 1 ; firefox localhost:8888 ; fg %1"

devel-publish: build
	rsync -avzP --delete build/lib/notebook/ basthon:sites_basthon/devel/notebook/

.PHONY: clean build all test install-kernel _install-kernel archives version devel-publish
