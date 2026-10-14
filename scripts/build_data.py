"""Construye data/locales.json a partir de las lecturas en data/raw/*.json y la lista de locales."""
import json, glob

raw = {}
for f in glob.glob('data/raw/*.json'):
    d = json.load(open(f, encoding='utf-8'))
    raw[d['local']] = d

NOMBRES_PROPIOS = {'rodrigo', 'ester', 'aliá', 'felipe', 'emma', 'alexa', 'max', 'jesús', 'desi'}  # nombres del personal: no se publican


def limpiar(chips):
    out = []
    for c in chips:
        p = c.rsplit(' ', 1)
        if len(p) == 2 and p[1].isdigit() and p[0].lower() not in NOMBRES_PROPIOS:
            out.append({'tema': p[0], 'menciones': int(p[1])})
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
    if nombre == 'One Burger Valencia':
        e['chips'] = [{'tema': 'concepto', 'menciones': 57}, {'tema': 'concepto lavadora', 'menciones': 53},
                      {'tema': 'innovador', 'menciones': 22}, {'tema': 'ambientado', 'menciones': 21}]
    out.append(e)

json.dump({'actualizado': '2026-10-14', 'locales': out}, open('data/locales.json', 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
print(len(out), 'locales;', 'leídos:', [e['local'] for e in out if e['leido']])
