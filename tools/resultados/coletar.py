"""Coleta retomável dos RDVs oficiais de 2026. Publica somente contagens agregadas.

python tools/resultados/coletar.py --ufs ce --workers 16
O export é separado: nunca transforma uma coleta parcial em resultado completo.
"""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sqlite3
import threading
import time

import asn1tools
import requests

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / '.cache-resultados'
BASE = 'https://resultados.tse.jus.br/oficial'
UFS = 'ce ac al am ap ba df es go ma mg ms mt pa pb pe pi pr rj rn ro rr rs sc se sp to zz'.split()
SPEC = asn1tools.compile_files(str(Path(__file__).parent / 'spec/rdv.asn1'), codec='ber', numeric_enums=True)
LOCAL = threading.local()


def get(url):
    if not hasattr(LOCAL, 'session'):
        LOCAL.session = requests.Session()
    for attempt in range(5):
        try:
            r = LOCAL.session.get(url, timeout=(10, 40))
            r.raise_for_status()
            return r.content
        except requests.RequestException:
            if attempt == 4:
                raise
            time.sleep(min(20, 2 ** attempt))


def decode(raw, municipio, zona, secao):
    entity, length = SPEC.decode_with_length('EntidadeResultadoRDV', raw)
    if length != len(raw):
        raise ValueError('Bytes não consumidos no RDV')
    r = entity['rdv']
    ident = r['identificacao']
    mz = ident['municipioZona']
    if (r['pleito'], r['fase'], mz['municipio'], mz['zona'], ident['secao']) != (3221, 2, int(municipio), int(zona), int(secao)):
        raise ValueError('RDV de outro pleito, fase ou seção')
    cargos = {}
    for e in r['eleicoes'][1]:
        # O mesmo pleito também contém eleições suplementares e consultas
        # locais. Elas não pertencem aos dois cargos desta contagem.
        if e['idEleicao'] not in (6258,6260):
            continue
        for c in e['votosCargos']:
            kind, cargo = c['idCargo']
            if kind != 'cargoConstitucional' or cargo not in (1, 3):
                raise ValueError(f'Cargo inesperado no segundo turno: eleição {e["idEleicao"]}, {kind}={cargo}')
            if e['idEleicao'] != {1: 6258, 3: 6260}[cargo] or c['quantidadeEscolhas'] != 1 or str(cargo) in cargos:
                raise ValueError('Eleição ou quantidade de escolhas inesperada')
            counts = Counter(f"{v['tipoVoto']}:{v.get('digitacao', '')}" for v in c['votos'])
            if any(v['tipoVoto'] not in range(1, 10) for v in c['votos']):
                raise ValueError('Tipo de voto desconhecido')
            cargos[str(cargo)] = dict(counts)
    if '1' not in cargos:
        raise ValueError('RDV sem Presidente')
    return {'local': ident['local'], 'cargos': cargos}


def collect(uf, municipio, zona, secao):
    directory = f'{BASE}/ele2026/arquivo-urna/3221/dados/{uf}/{municipio}/{zona}/{secao}'
    aux_url = f'{directory}/p003221-{uf}-m{municipio}-z{zona}-s{secao}-aux.json'
    aux_raw = get(aux_url)
    aux = json.loads(aux_raw)
    hashes = [h for h in aux['hashes'] if h['st'].lower() == 'totalizado']
    if len(hashes) != 1:
        raise ValueError('Quantidade ambígua de hashes totalizados')
    h = hashes[0]
    files = [a for a in h['arq'] if a['tp'] == 'rdv']
    if len(files) != 1:
        raise ValueError('Quantidade ambígua de RDVs: requer revisão')
    url = f"{directory}/{h['hash']}/{files[0]['nm']}"
    raw = get(url)
    result = decode(raw, municipio, zona, secao)
    result.update(url=url, sha256=hashlib.sha256(raw).hexdigest(), baixadoEm=datetime.now(timezone.utc).isoformat())
    # Retém originais para auditoria, fora de public/ e do Git.
    path = CACHE / 'rdv' / uf / municipio / zona
    path.mkdir(parents=True, exist_ok=True)
    (path / f'{secao}.dat').write_bytes(raw)
    (path / f'{secao}-aux.json').write_bytes(aux_raw)
    return result


def open_db():
    CACHE.mkdir(exist_ok=True)
    db = sqlite3.connect(CACHE / 'rdv.sqlite', timeout=120)
    db.execute('pragma journal_mode=WAL')
    db.execute('create table if not exists secoes (uf text, municipio text, zona text, secao text, principal text, resultado text, erro text, primary key(uf,municipio,zona,secao))')
    return db


def run(args):
    db = open_db()
    for uf in args.ufs:
        index_url = f'{BASE}/ele2026/arquivo-urna/3221/config/{uf}/{uf}-p003221-cs.json'
        raw = get(index_url)
        (CACHE / f'{uf}-secoes.json').write_bytes(raw)
        cs = json.loads(raw)
        if cs['cdp'] != '3221':
            raise ValueError('Índice de outro pleito')
        for a in cs['abr']:
            if a['cd'] != uf:
                raise ValueError('Índice de outra UF')
            for m in a['mu']:
                for z in m['zon']:
                    for s in z['sec']:
                        db.execute('insert or ignore into secoes (uf,municipio,zona,secao,principal) values (?,?,?,?,?)', (uf,m['cd'],z['cd'],s['ns'],s.get('nsp')))
        db.commit()
        pending = db.execute('select uf,municipio,zona,secao from secoes where uf=? and principal is null and resultado is null', (uf,)).fetchall()
        if args.limite:
            pending = pending[:args.limite]
        print(f'{uf}: {len(pending)} seções pendentes', flush=True)
        start = time.monotonic()
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {pool.submit(collect, *s): s for s in pending}
            for i, future in enumerate(as_completed(futures), 1):
                section = futures[future]
                try:
                    result = future.result()
                    db.execute('update secoes set resultado=?,erro=null where uf=? and municipio=? and zona=? and secao=?', (json.dumps(result, separators=(',', ':')), *section))
                except Exception as e:
                    db.execute('update secoes set erro=? where uf=? and municipio=? and zona=? and secao=?', (str(e), *section))
                if i % 50 == 0 or i == len(pending):
                    db.commit()
                if i % 500 == 0 or i == len(pending):
                    errors = db.execute('select count(*) from secoes where uf=? and erro is not null', (uf,)).fetchone()[0]
                    print(f'{uf}: {i}/{len(pending)}; {i / max(1,time.monotonic()-start):.1f} seções/s; {errors} erros', flush=True)
        db.commit()
    db.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ufs', nargs='+', choices=UFS, default=UFS)
    parser.add_argument('--workers', type=int, default=16)
    parser.add_argument('--limite', type=int)
    run(parser.parse_args())
