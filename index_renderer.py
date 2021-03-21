from jinja2 import Environment, FileSystemLoader, select_autoescape
import time
import sys


env = Environment(
    loader=FileSystemLoader('notebook/basthon/'),
    autoescape=select_autoescape(['html'])
)

index = env.get_template('index.template.html')
index = index.render(BASTHON_CACHE_BUSTING_TIMESTAMP=int(time.time()))

with open(sys.argv[1], 'w') as f:
    f.write(index)
