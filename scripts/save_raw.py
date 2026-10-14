"""Guarda la lectura de un local: python3 scripts/save_raw.py "Voltereta Casa" Voltereta '<json del lector>'"""
import json, sys, datetime
local, marca, payload = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
d = {'local': local, 'marca': marca, 'leido': datetime.date.today().isoformat(),
     'rating': None, 'total': sum(payload['dist'].values()), 'dist': payload['dist'], 'chips': payload['chips'],
     'muestraBajas': payload['muestraBajas'], 'bajas12m': payload['bajas12m'],
     'sinRespuesta12m': payload['sinRespuesta12m'], 'quejas': payload['quejas']}
t = d['total']
d['rating'] = round(sum(int(k) * v for k, v in d['dist'].items()) / t, 1) if t else None
fn = 'data/raw/' + local.lower().replace(' ', '-').replace('í', 'i') + '.json'
json.dump(d, open(fn, 'w', encoding='utf-8'), ensure_ascii=False)
print(fn, d['total'], d['rating'])
