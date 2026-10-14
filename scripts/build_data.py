"""Construye data/locales.json a partir de las lecturas en data/raw/*.json y la lista de locales."""
import json, glob

raw = {}
for f in glob.glob('data/raw/*.json'):
    d = json.load(open(f, encoding='utf-8'))
    raw[d['local']] = d

NOMBRES_PROPIOS = {'rodrigo', 'ester', 'aliá', 'felipe', 'emma', 'alexa', 'max', 'jesús', 'desi', 'xavi', 'hundred'}  # nombres del personal: no se publican

RENOMBRAR = {'lavadora': 'concepto lavadora'}  # concepto de lavandería de One Burger


def limpiar(chips):
    out = []
    for c in chips:
        p = c.rsplit(' ', 1)
        if len(p) == 2 and p[1].isdigit() and p[0].lower() not in NOMBRES_PROPIOS:
            out.append({'tema': RENOMBRAR.get(p[0].lower(), p[0]), 'menciones': int(p[1])})
    return out


# marca, local, direccion, puntaje, total, distribucion
LOCALES = [
    ('Voltereta', 'Voltereta Bali', 'Gran Via del Marqués del Túria, 59', 4.6, 24033, None),
    ('Voltereta', 'Voltereta Casa', 'Av. de les Corts Valencianes, 26', 4.6, 10993, None),
    ('Voltereta', 'Voltereta Manhattan', "Carrer d'Isabel la Catòlica, 11", 4.6, 14888, None),
    ('Voltereta', 'Voltereta Kioto', "Pg. de l'Albereda, 51", 4.5, 15089, None),
    ('Begin', 'Begin Origen', 'Av. de les Corts Valencianes, 50', 4.5, 7779, None),
    ('Begin', 'Begin Profundidades Marinas', 'C/ de Pascual i Genís, 11', 4.6, 7668, None),
    ('Begin', 'Begin Invernadero', 'C. de Ramon Llull, 1', None, None, None),
    ('Begin', 'Begin Huerta', 'Paseo de la Alameda, 47', None, None, None),
    ('Begin', 'Begin Jardín Secreto', 'C. de Martínez Ferrando, 5', None, None, None),
    ('One Burger', 'One Burger Valencia', 'Carrer de Misser Mascó, 42', 4.5, 1549,
     {'1': 81, '2': 43, '3': 76, '4': 135, '5': 1214}),
]

import os, datetime
HOY = datetime.date.today().isoformat()
UMBRAL = 4.5          # meta del KPI
VIGILANCIA = 4.6      # entre 4,5 y 4,6: cumple pero en vigilancia
MIN_RESENAS = 100     # por debajo, el dato se marca como provisional


def prom(r):
    n = sum(r['estrellas'].values())
    return round(sum(int(k) * v for k, v in r['estrellas'].items()) / n, 2) if n else None


# lectura anterior más reciente (anterior a hoy), para comparar
previas = sorted(f for f in glob.glob('data/historial/20*.json') if os.path.basename(f)[:10] < HOY)
previa = json.load(open(previas[-1], encoding='utf-8')) if previas else None

out = []
for marca, nombre, direccion, r, t, dist in LOCALES:
    e = {'id': nombre.lower().replace(' ', '-').replace('í', 'i'), 'marca': marca, 'local': nombre,
         'direccion': direccion, 'rating': r, 'total': t, 'dist': dist, 'leido': None, 'chips': [],
         'muestraBajas': 0, 'bajas12m': 0, 'sinRespuesta12m': 0, 'quejas': {}}
    if nombre in raw:
        d = raw[nombre]
        e.update({'rating': d['rating'], 'total': d['total'], 'dist': d['dist'], 'leido': d['leido'],
                  'chips': limpiar(d['chips']), 'muestraBajas': d['muestraBajas'], 'bajas12m': d['bajas12m'],
                  'sinRespuesta12m': d['sinRespuesta12m'], 'quejas': d['quejas']})
    import os
    rf='data/recent/'+e['id'].replace('í','i')+'.json'
    if os.path.exists(rf): e['reciente']=json.load(open(rf,encoding='utf-8'))
    if 'reciente' in e:
        e['reciente']['promedio'] = prom(e['reciente'])
        p = previa and previa['locales'].get(e['id'])
        if p:
            e['previo'] = {'fecha': previa['fecha'], 'promedio': p['promedio'], 'leidas': p['leidas']}
    out.append(e)

# foto de hoy (sin textos ni nombres): permite comparar entre lecturas
snap = {'fecha': HOY, 'locales': {e['id']: {'rating': e['rating'], 'total': e['total'], 'dist': e['dist'],
        'promedio': e['reciente']['promedio'], 'leidas': e['reciente']['leidas'], 'estrellas': e['reciente']['estrellas'],
        'positivos': e['reciente']['positivos'], 'negativos': e['reciente']['negativos']}
        for e in out if 'reciente' in e}}
json.dump(snap, open(f'data/historial/{HOY}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

json.dump({'actualizado': HOY, 'meta': {'umbral': UMBRAL, 'vigilancia': VIGILANCIA, 'minResenas': MIN_RESENAS}, 'locales': out}, open('data/locales.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print(len(out), 'locales;', 'leídos:', [e['local'] for e in out if e['leido']])
