# supported languages
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
