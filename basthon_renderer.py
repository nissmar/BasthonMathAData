from jinja2 import Environment, FileSystemLoader, select_autoescape
import time
import sys
from pathlib import Path


language = sys.argv[1]
# diplayed language name
language_name = {'python3': 'Python 3',
                 'javascript': 'Javascript',
                 'sql': 'SQL'}.get(language, language)
language_simple = language if language != 'python3' else 'python'
language_codemirror = language if language != 'python3' else 'ipython'

output_dir = Path(sys.argv[2])

macros = {'BASTHON_CACHE_BUSTING_TIMESTAMP': int(time.time()),
          'BASTHON_LANGUAGE': language,
          'BASTHON_LANGUAGE_NAME': language_name,
          'BASTHON_LANGUAGE_SIMPLE': language_simple,
          'BASTHON_LANGUAGE_CODEMIRROR': language_codemirror}


# rendering index.html
env = Environment(
    loader=FileSystemLoader('notebook'),
    autoescape=select_autoescape(['html'])
)

index = env.get_template('index.template.html')
index = index.render(**macros)

with open(output_dir / 'index.html', 'w') as f:
    f.write(index)

# rendering Untitled.ipynb
env = Environment(
    loader=FileSystemLoader('notebook/api/contents')
)

ipynb = env.get_template('Untitled.template.ipynb')
ipynb = ipynb.render(**macros)

with open(output_dir / 'api' / 'contents' / 'Untitled.ipynb', 'w') as f:
    f.write(ipynb)
