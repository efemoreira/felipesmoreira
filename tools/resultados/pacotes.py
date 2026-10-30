"""Lê somente os RDVs dos ZIPs oficiais por HTTP Range, sem baixar os logs.

Usa o índice central do ZIP e lotes multipart/byteranges. Cada RDV é conferido
por tamanho e CRC do ZIP e decodificado com a especificação oficial do TSE.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from email import policy
from email.parser import BytesParser
import hashlib
import io
import json
import re
import struct
import time
import zipfile
import zlib

from coletar import BASE, CACHE, UFS, LOCAL, decode, get, open_db
import requests


def ranged(url, ranges):
    if not hasattr(LOCAL, 'range_session'):
        LOCAL.range_session = requests.Session()
    for attempt in range(5):
        try:
            r = LOCAL.range_session.get(url, headers={'Range': 'bytes=' + ','.join(ranges)}, timeout=(10, 60))
            r.raise_for_status()
            if r.status_code != 206:
                raise ValueError('Servidor não respeitou HTTP Range')
            return r
        except requests.RequestException:
            if attempt == 4:
                raise
            time.sleep(2 ** attempt)


class RemoteZip(io.RawIOBase):
    def __init__(self, url):
        self.url = url
        r = ranged(url, ['-22'])
        self.size = int(r.headers['Content-Range'].split('/')[-1])
        self.pos = 0

    def seekable(self):
        return True

    def seek(self, offset, whence=0):
        self.pos = offset + (self.size if whence == 2 else self.pos if whence == 1 else 0)
        return self.pos

    def tell(self):
        return self.pos

    def read(self, size=-1):
        end = min(self.size, self.pos + size) if size >= 0 else self.size
        if end <= self.pos:
            return b''
        b = ranged(self.url, [f'{self.pos}-{end-1}']).content
        if len(b) != end-self.pos:
            raise ValueError('Range truncado')
        self.pos = end
        return b


PATTERN = re.compile(r'o03221([a-z]{2})(\d{5})(\d{4})(\d{4})-rdv(?:red)?\.dat$', re.I)


def read_batch(url, infos):
    # 1 KiB além do cabeçalho comporta nome/extra dos arquivos do TSE.
    spans = [(i.header_offset, i.header_offset + i.compress_size + 1023) for i in infos]
    response = ranged(url, [f'{a}-{b}' for a,b in spans])
    content_type = response.headers['Content-Type']
    if content_type.startswith('multipart/'):
        message = BytesParser(policy=policy.default).parsebytes(f'Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n'.encode() + response.content)
        parts = {int(p['Content-Range'].split()[1].split('-')[0]): p.get_payload(decode=True) for p in message.iter_parts()}
    else:
        if len(infos) != 1:
            raise ValueError('Servidor não retornou multipart')
        parts = {spans[0][0]: response.content}
    results = []
    for info, (start, end) in zip(infos, spans):
        b = parts[start]
        if b[:4] != b'PK\x03\x04':
            raise ValueError('Cabeçalho ZIP inválido')
        name_len, extra_len = struct.unpack_from('<HH', b, 26)
        filename = b[30:30+name_len].decode('utf8')
        if filename != info.filename:
            raise ValueError('Entrada ZIP não corresponde ao índice')
        pos = 30 + name_len + extra_len
        compressed = b[pos:pos+info.compress_size]
        if len(compressed) != info.compress_size:
            raise ValueError('Range insuficiente para arquivo')
        if info.compress_type == zipfile.ZIP_DEFLATED:
            raw = zlib.decompress(compressed, -15)
        elif info.compress_type == zipfile.ZIP_STORED:
            raw = compressed
        else:
            raise ValueError('Compressão ZIP não suportada')
        if len(raw) != info.file_size or zlib.crc32(raw) != info.CRC:
            raise ValueError('RDV não confere com CRC/tamanho do pacote')
        uf, mun, zona, secao = PATTERN.search(filename).groups()
        result = decode(raw, mun, zona, secao)
        result.update(url=url, arquivo=filename, offset=info.header_offset, sha256=hashlib.sha256(raw).hexdigest())
        results.append(((uf,mun,zona,secao), result))
    return results


def run(args):
    db = open_db()
    package_url = 'https://dadosabertos.tse.jus.br/api/3/action/package_show?id=resultados-2026-arquivos-transmitidos-para-totalizacao'
    package = json.loads(get(package_url))['result']
    (CACHE / 'pacotes.json').write_text(json.dumps(package), encoding='utf8')
    resources = {r['name'][:2].lower(): r['url'] for r in package['resources'] if 'Segundo turno' in r['name'] and r['url'].endswith('.zip')}
    for uf in args.ufs:
        raw = get(f'{BASE}/ele2026/arquivo-urna/3221/config/{uf}/{uf}-p003221-cs.json')
        (CACHE / f'{uf}-secoes.json').write_bytes(raw)
        cs = json.loads(raw)
        if cs['cdp'] != '3221':
            raise ValueError('Índice de outro pleito')
        for a in cs['abr']:
            for m in a['mu']:
                for z in m['zon']:
                    for s in z['sec']:
                        db.execute('insert or ignore into secoes (uf,municipio,zona,secao,principal) values (?,?,?,?,?)', (uf,m['cd'],z['cd'],s['ns'],s.get('nsp')))
        db.commit()
        if uf not in resources:
            print(f'{uf}: pacote indisponível; usar coletar.py para as seções', flush=True)
            continue
        url = resources[uf]
        done = set(db.execute('select uf,municipio,zona,secao from secoes where uf=? and resultado is not null', (uf,)))
        with zipfile.ZipFile(RemoteZip(url)) as archive:
            infos = [i for i in archive.infolist() if PATTERN.search(i.filename)]
        # Não soma duas recuperações da mesma seção. Casos ambíguos vão à API.
        keys = [PATTERN.search(i.filename).groups() for i in infos]
        from collections import Counter
        duplicates = {k for k,v in Counter(keys).items() if v > 1}
        infos = [i for i,k in zip(infos,keys) if k not in done and k not in duplicates]
        batches = [infos[i:i+args.lote] for i in range(0,len(infos),args.lote)]
        print(f'{uf}: {len(infos)} RDVs em {len(batches)} lotes; {len(duplicates)} seções ambíguas', flush=True)
        start = time.monotonic()
        count = errors = 0
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {pool.submit(read_batch,url,b): b for b in batches}
            for future in as_completed(futures):
                try:
                    for section, result in future.result():
                        db.execute('update secoes set resultado=?,erro=null where uf=? and municipio=? and zona=? and secao=? and principal is null', (json.dumps(result,separators=(',',':')), *section))
                        count += 1
                except Exception as e:
                    errors += 1
                    print(f'{uf}: lote falhou: {e}', flush=True)
                db.commit()
                if count % (args.lote*10) == 0 or count+errors*args.lote >= len(infos):
                    print(f'{uf}: {count}/{len(infos)}, {count/max(1,time.monotonic()-start):.1f} RDVs/s, {errors} lotes com erro', flush=True)
        print(f'{uf}: concluído; pendentes: '+str(db.execute('select count(*) from secoes where uf=? and principal is null and resultado is null',(uf,)).fetchone()[0]), flush=True)
    db.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ufs', nargs='+', choices=UFS, default=UFS)
    parser.add_argument('--workers', type=int, default=8)
    parser.add_argument('--lote', type=int, default=32)
    run(parser.parse_args())
