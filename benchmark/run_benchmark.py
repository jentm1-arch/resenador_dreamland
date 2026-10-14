"""Compara modelos clasificando la misma muestra. Uso:
  ANTHROPIC_API_KEY=... OPENAI_API_KEY=... python3 -I benchmark/run_benchmark.py
Entradas (locales, no se suben al repo):
  benchmark/muestra.json  -> [{"id":1,"t":"texto"}, ...]  (unas 30 reseñas, sin nombres)
  benchmark/manual.json   -> {"1":["esperas"], ...}       (tu clasificación a mano)
Salida: aciertos por modelo y tokens/coste reales, leídos de la respuesta de cada API."""
import json, os, sys, urllib.request

MODELOS = {  # nombre: (proveedor, id del modelo, USD por millón entrada, salida). Precios consultados 14/10/2026
    'Claude Haiku 5.5': ('anthropic', 'claude-haiku-5-5', 0.10, 0.50),
    'Claude Sonnet 5.5': ('anthropic', 'claude-sonnet-5-5', 2.0, 10.0),
    'OpenAI gpt-6-luna': ('openai', 'gpt-6-luna', 0.10, 0.50),
    'OpenAI gpt-6.1-sol': ('openai', 'gpt-6.1-sol', 2.0, 10.0),
}
base = os.path.dirname(os.path.abspath(__file__))
prompt = open(f'{base}/prompt.txt', encoding='utf-8').read()
muestra = json.load(open(f'{base}/muestra.json', encoding='utf-8'))
manual = json.load(open(f'{base}/manual.json', encoding='utf-8'))
user = '\n'.join(f"{r['id']}. {r['t'][:600]}" for r in muestra)


def post(url, headers, body):
    req = urllib.request.Request(url, json.dumps(body).encode(), {**headers, 'content-type': 'application/json'})
    return json.load(urllib.request.urlopen(req, timeout=120))


def llamar(prov, modelo):
    if prov == 'anthropic':
        r = post('https://api.anthropic.com/v1/messages',
                 {'x-api-key': os.environ['ANTHROPIC_API_KEY'], 'anthropic-version': '2023-06-01'},
                 {'model': modelo, 'max_tokens': 4000, 'system': prompt, 'messages': [{'role': 'user', 'content': user}]})
        return r['content'][0]['text'], r['usage']['input_tokens'], r['usage']['output_tokens']
    r = post('https://api.openai.com/v1/chat/completions', {'authorization': 'Bearer ' + os.environ['OPENAI_API_KEY']},
             {'model': modelo, 'messages': [{'role': 'system', 'content': prompt}, {'role': 'user', 'content': user}]})
    return r['choices'][0]['message']['content'], r['usage']['prompt_tokens'], r['usage']['completion_tokens']


def f1(pred, real):
    p, r = set(pred), set(real)
    if not p and not r: return 1.0
    tp = len(p & r)
    return 2 * tp / (len(p) + len(r)) if (p or r) else 0


for nombre, (prov, modelo, pi, po) in MODELOS.items():
    clave = 'ANTHROPIC_API_KEY' if prov == 'anthropic' else 'OPENAI_API_KEY'
    if clave not in os.environ:
        print(nombre, ': falta', clave); continue
    try:
        txt, ti, to = llamar(prov, modelo)
        res = {str(x['id']): x['temas'] for x in json.loads(txt[txt.index('{'):txt.rindex('}') + 1])['resultados']}
    except Exception as e:
        print(nombre, ': error', e); continue
    ids = [k for k in manual if k in res]
    exacto = sum(set(res[k]) == set(manual[k]) for k in ids) / max(len(ids), 1)
    sim = sum(f1(res[k], manual[k]) for k in ids) / max(len(ids), 1)
    coste = ti / 1e6 * pi + to / 1e6 * po
    print(f'{nombre}: coincidencia exacta {exacto:.0%}, solape medio {sim:.0%}, tokens {ti}+{to}, coste ${coste:.5f}')
