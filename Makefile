clean:
	rm -rf notebook/static/components/
	python3 setup.py clean

build: clean
	python3 setup.py build

.PHONY: clean build
