"""Cache dos totais oficiais para conferir a leitura dos RDVs por município/cargo."""
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import requests
from coletar import BASE, CACHE, get


def fetch(key):
    uf,mun,cargo = key
    ele = {1:6258,3:6260}[cargo]
    url = f'{BASE}/ele2026/{ele}/dados/{uf}/{uf}{mun}-c{cargo:04d}-e{ele:06d}-u.json'
    path = CACHE/'oficiais'/f'{uf}-{mun or "uf"}-{cargo}.json'
    if not path.exists():
        path.write_bytes(get(url))
    p = json.loads(path.read_bytes())
    if p['t'] != '2' or p['f'] != 'o' or p['ele'] != str(ele):
        raise ValueError('Total oficial de outra eleição')
    return key, p


def first_round_president():
    """Total oficial do 1º turno para Presidente no Brasil: a régua dos outros eliminados."""
    path = CACHE/'oficiais-1t'/'br-1.json'
    path.parent.mkdir(exist_ok=True)
    if not path.exists():
        path.write_bytes(get(f'{BASE}/ele2026/6257/dados/br/br-c0001-e006257-u.json'))
    p = json.loads(path.read_bytes())
    if p['t'] != '1' or p['ele'] != '6257' or p.get('tf') != 's':
        raise ValueError('Total do 1º turno incompleto ou de outra eleição')


def run():
    first_round_president()
    (CACHE/'oficiais').mkdir(exist_ok=True)
    municipalities = json.loads((CACHE/'municipios.json').read_text())
    keys = []
    for a in municipalities['abr']:
        uf = a['cd']
        has_gov = False
        if uf != 'zz':
            url = f'{BASE}/ele2026/6260/dados/{uf}/{uf}-c0003-e006260-u.json'
            response = requests.get(url,timeout=30)
            if response.status_code == 200:
                (CACHE/'oficiais'/f'{uf}-uf-3.json').write_bytes(response.content)
                has_gov = True
            elif response.status_code != 404:
                response.raise_for_status()
        keys.extend([(uf,'',1)])
        for m in a['mu']:
            keys.append((uf,m['cd'],1))
            if has_gov:
                keys.append((uf,m['cd'],3))
    with ThreadPoolExecutor(max_workers=16) as pool:
        futures = {pool.submit(fetch,key):key for key in keys}
        failures = []
        for i,future in enumerate(as_completed(futures),1):
            try:
                future.result()
            except Exception as e:
                failures.append((futures[future],str(e)))
            if i % 500 == 0 or i == len(keys):
                print(f'Totais oficiais: {i}/{len(keys)}; {len(failures)} erros',flush=True)
    (CACHE/'oficiais-erros.json').write_text(json.dumps(failures))
    if failures:
        raise ValueError(f'{len(failures)} totais indisponíveis')


if __name__ == '__main__':
    run()
