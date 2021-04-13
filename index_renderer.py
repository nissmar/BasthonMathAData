from jinja2 import Environment, FileSystemLoader, select_autoescape
import time
import sys


language = sys.argv[1]
# diplayed language name
language_name = {'python3': 'Python 3',
                 'javascript': 'Javascript',
                 'sql': 'SQL'}.get(language, language)

output = sys.argv[2]


env = Environment(
    loader=FileSystemLoader('notebook/basthon/'),
    autoescape=select_autoescape(['html'])
)

index = env.get_template('index.template.html')
index = index.render(BASTHON_CACHE_BUSTING_TIMESTAMP=int(time.time()),
                     BASTHON_LANGUAGE=language,
                     BASTHON_LANGUAGE_NAME=language_name)

with open(output, 'w') as f:
    f.write(index)
