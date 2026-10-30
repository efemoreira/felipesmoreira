"""Exporta contagens do segundo turno e a cobertura de cada recorte geográfico.

Mantém o primeiro turno intacto. Não calcula apoio, retenção ou consolidação.
Do primeiro turno vem a referência `votos14_1t` (votos nominais no 14 para
Presidente no 1º turno, no mesmo recorte), lida dos JSONs já publicados em
`public/resultados-2026/`. Com ela:

- `explorar/<uf>/<município>.json` põe o 2º turno nos bairros do 1º turno
  (`bairro_chave`), local por local, para o Explorador pintar as mesmas áreas;
- `t2_fiel_aj` é a fidelidade (nulos com 14 ÷ 14 no 1º turno) puxada para a
  do nível de cima na medida da incerteza: peso `k` votos, estimado dos
  próprios dados (variação real entre lugares além do acaso de contagem);
- `resumo.fidelidade.referencia` é a mesma razão para os outros candidatos a
  Presidente eliminados no 1º turno (total oficial do TSE), a régua do ruído.

Tudo é comparação de agregados, não rastreio de eleitor.
"""
from collections import Counter, defaultdict
from datetime import datetime, timezone
import json
from pathlib import Path
import unicodedata

from coletar import CACHE, ROOT, UFS, open_db
from localizar import LOCAIS, BAIRROS, MUNICIPIOS

DEST = ROOT/'public/contagem-2026-2t'
FIRST = ROOT/'public/resultados-2026'


VINCULO_PADRAO = 'UF, município, zona e local do RDV'
LOCALIZACAO_PADRAO = 'Coordenada em bairro IBGE'


def plain(s):
    return ' '.join(unicodedata.normalize('NFD',s).encode('ascii','ignore').decode().lower().split())


def prior_strength(items, minimum=100):
    """Peso do nível de cima, em votos: p(1-p) ÷ variância real entre lugares.

    items: (nulos com 14, 14 no 1º turno, razão do nível de cima). Método dos
    momentos: tira da dispersão observada a parte que o acaso de contagem explica.
    """
    num = den = xs = ns = 0
    for x,n,p in items:
        if n < minimum or not p:
            continue
        num += n*(x/n-p)**2 - p*(1-p)
        den += n
        xs += x
        ns += n
    if not den:
        return None
    pbar = xs/ns
    tau2 = num/den
    return round(pbar*(1-pbar)/tau2) if tau2 > 0 else None


def shrink(x, n, p, k):
    if not n or p is None or k is None:
        return None
    return round((x + k*p)/(n + k), 5)


def fidelity_reference(national_hist):
    """Os outros eliminados no 1º turno para Presidente: quantos digitaram o número deles no 2º."""
    p = CACHE/'oficiais-1t'/'br-1.json'
    if not p.exists():
        return []
    d = json.loads(p.read_bytes())
    in_second = {k.split(':')[1] for k in national_hist.get('1',{}) if k.startswith('2:')}
    out = []
    for cargo in d['carg']:
        for group in cargo['agr']:
            for party in group['par']:
                for c in party['cand']:
                    votes = int(c['vap'])
                    # Abaixo de 100 mil o número coincide com digitação comum e a razão não diz nada.
                    if c['n'] in in_second or votes < 100000:
                        continue
                    nulls = national_hist.get('1',{}).get(f"4:{c['n']}",0)
                    out.append(dict(numero=c['n'],nome=c['nmu'],votos_1t=votes,nulos_2t=nulls,por100=round(100*nulls/votes,2)))
    return sorted(out,key=lambda r:-r['por100'])


def first_round(uf):
    """Votos no 14 (Presidente, 1º turno) por município e por (município, zona, local), e o bairro de cada local."""
    p = FIRST/'uf'/f'{uf}.json'
    if not p.exists():
        return {},{}
    t = json.loads(p.read_bytes())['cidades']
    i,v = t['colunas'].index('municipio_codigo'),t['colunas'].index('missao_pres')
    cities = {str(r[i]).zfill(5):r[v] for r in t['linhas'] if r[v] is not None}
    places = {}
    neighborhood_of = {}
    for f in (FIRST/'bairros'/uf).glob('*.json') if (FIRST/'bairros'/uf).exists() else []:
        b = json.loads(f.read_bytes())
        lt = b.get('locais') or {'colunas':[],'linhas':[]}
        bt = b.get('bairros') or {'colunas':[],'linhas':[]}
        if not lt['linhas']:
            continue
        z,l,m,bi = (lt['colunas'].index(c) for c in ('zona','local','missao_pres','b'))
        chave = bt['colunas'].index('bairro_chave')
        for r in lt['linhas']:
            if r[m] is not None:
                places[f.stem,int(r[z]),int(r[l])] = r[m]
            if r[bi] is not None:
                neighborhood_of[f.stem,int(r[z]),int(r[l])] = bt['linhas'][r[bi]][chave]
    return cities,places,neighborhood_of


def merge_cadastral(locals_out):
    """Bairro do cadastro TSE com o mesmo nome de um bairro IBGE da cidade vira esse bairro.

    Sem isso o mesmo bairro aparece duas vezes na tabela (uma pela coordenada,
    outra pelo nome do cadastro). Só junta quando o nome bate com um único bairro IBGE.
    """
    ibge = defaultdict(set)
    for loc in locals_out:
        if loc['origem'] == 'IBGE · coordenada':
            ibge[plain(loc['bairro'])].add((loc['bairro_id'],loc['bairro']))
    spellings = defaultdict(Counter)
    for loc in locals_out:
        found = ibge.get(plain(loc['bairro'])) if loc['origem'] == 'TSE · cadastro' else None
        if found and len(found) == 1:
            loc['bairro_id'],loc['bairro'] = next(iter(found))
            loc['origem'] = 'IBGE · nome do cadastro'
        elif loc['origem'] == 'TSE · cadastro':
            # "CONJUNTO UNIVERSITARIO" e "CONJUNTO UNIVERSITÁRIO" são o mesmo bairro.
            loc['bairro_id'] = 'tse:'+plain(loc['bairro']).upper()
            spellings[loc['bairro_id']][loc['bairro']] += 1
    # Grafia mais usada; no empate, a acentuada.
    names = {k:max(c,key=lambda n:(c[n],len(n.encode()))) for k,c in spellings.items()}
    for loc in locals_out:
        if loc['bairro_id'] in names:
            loc['bairro'] = names[loc['bairro_id']]


def neighborhood_source(sources):
    """Origem do bairro a partir das origens dos seus locais."""
    if len(sources) == 1:
        return next(iter(sources))
    return 'IBGE · coordenada e nome do cadastro'


def write(name, value):
    p = DEST/name
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(value,ensure_ascii=False,separators=(',',':'),allow_nan=False),encoding='utf8')


def table(rows):
    columns = list(dict.fromkeys(k for r in rows for k in r))
    return {'colunas':columns,'linhas':[[r.get(c) for c in columns] for r in rows]}


def amounts(hist):
    result = {'votos':sum(hist.values()),'nulos':0,'brancos':0,'nominais':0,'nulos14':hist.get('4:14',0)}
    for k,value in hist.items():
        kind = int(k.split(':')[0])
        if kind in (4,6,7,8,9):
            result['nulos'] += value
        elif kind in (3,5):
            result['brancos'] += value
        elif kind == 2:
            result['nominais'] += value
    return result


def fields(hist):
    result = {}
    for cargo,h in hist.items():
        for k,v in amounts(h).items():
            result[f'{k}_{cargo}'] = v
    return result


def official(uf,mun,cargo):
    p = CACHE/'oficiais'/f'{uf}-{mun or "uf"}-{cargo}.json'
    return json.loads(p.read_bytes()) if p.exists() else None


def check(hist, p):
    if p is None:
        return 'Total oficial indisponível'
    v = p['v']
    a = amounts(hist)
    if p.get('tf') != 's':
        return 'Totalização em andamento'
    if any(a[k] != int(v[f]) for k,f in [('votos','tv'),('nulos','tvn'),('brancos','vb'),('nominais','vnom')]):
        return 'Divergência nos totais'
    candidates = {c['n']:int(c['vap']) for cargo in p['carg'] for group in cargo['agr'] for party in group['par'] for c in party['cand']}
    counted = {key.split(':')[1]:value for key,value in hist.items() if key.startswith('2:')}
    if any(counted.get(number,0) != value for number,value in candidates.items()) or any(number not in candidates for number in counted):
        return 'Divergência na conferência nominal'
    return 'Conferido'


def run():
    db = open_db()
    places = {(r['uf'],r['municipio'],r['zona'],r['local']):r for r in json.loads((CACHE/'locais-bairros.json').read_text())}
    section_places = {(u,m,z,s):(local,original) for u,m,z,s,local,original in json.loads((CACHE/'secoes-locais.json').read_text())}
    config = json.loads((CACHE/'municipios.json').read_text())
    names = {(a['cd'],m['cd']):m['nm'] for a in config['abr'] for m in a['mu']}
    uf_names = {a['cd']:a['ds'] for a in config['abr']}
    city_hist = defaultdict(lambda:defaultdict(Counter))
    local_hist = defaultdict(lambda:defaultdict(Counter))
    city_expected = Counter()
    city_read = Counter()
    local_read = Counter()
    local_originals = defaultdict(set)
    local_links = defaultdict(set)
    locals_by_city = defaultdict(dict)
    missing = []
    for uf,mun,zona,secao,principal,raw in db.execute('select uf,municipio,zona,secao,principal,resultado from secoes'):
        if principal is not None:
            continue
        city_expected[uf,mun] += 1
        if raw is None:
            missing.append({'uf':uf,'municipio':mun,'zona':zona,'secao':secao})
            continue
        r = json.loads(raw)
        city_read[uf,mun] += 1
        current_local = r['local']
        link = 'UF, município, zona e local do RDV'
        registered = section_places.get((uf,mun,int(zona),int(secao)))
        if registered and r['local'] in registered:
            current_local = registered[0]
            if current_local != r['local']:
                link = 'Seção e local original do RDV no cadastro do segundo turno'
        key = (uf,mun,int(zona),current_local)
        local_originals[key].add(r['local'])
        local_links[key].add(link)
        local_read[key] += 1
        for cargo,h in r['cargos'].items():
            city_hist[uf,mun][cargo].update(h)
            local_hist[key][cargo].update(h)
    cities_by_uf = defaultdict(list)
    for key,h in local_hist.items():
        locals_by_city[key[:2]][key] = h
    uf_hist = defaultdict(lambda:defaultdict(Counter))
    uf_verified = Counter()
    audit = []
    uninstalled_cities = set()
    detailed_count = 0
    first_by_uf = {}
    aligned_rows = []
    for (uf,mun),name in names.items():
        if uf not in first_by_uf:
            first_by_uf[uf] = first_round(uf)
        first_cities,first_places,first_neighborhoods = first_by_uf[uf]
        hist = city_hist[uf,mun]
        expected = city_expected[uf,mun]
        read = city_read[uf,mun]
        original_expected = expected
        p = official(uf,mun,1)
        # Só exclui do denominador quando o TSE confirma que TODAS as
        # seções da localidade não foram instaladas e que não houve votos.
        uninstalled = expected > 0 and read == 0 and p is not None and int(p['s']['si']) == 0 and int(p['s']['sni']) == expected and int(p['v']['tv']) == 0
        if uninstalled:
            uninstalled_cities.add((uf,mun))
            expected = 0
            hist['1'] = Counter()
        checks = {cargo:check(hist.get(cargo,Counter()),official(uf,mun,int(cargo))) for cargo in hist or {'1':{}}}
        complete = (expected > 0 or uninstalled) and read == expected
        verified = complete and all(v == 'Conferido' for v in checks.values())
        status = 'Sem seção instalada' if uninstalled and verified else 'Conferido' if verified else 'Coleta parcial' if not complete else '; '.join(sorted(set(checks.values())))
        city = dict(municipio=mun,nome=name,secoes_nao_instaladas=original_expected if uninstalled else 0,secoes_esperadas=expected,secoes_lidas=read,situacao=status,**fields(hist))
        if mun in first_cities:
            city['votos14_1t'] = first_cities[mun]
        first_file = FIRST/'bairros'/uf/f'{mun}.json'
        detailed = first_file.exists() and bool(json.loads(first_file.read_bytes()).get('bairros',{}).get('linhas'))
        city['recorte'] = 'Bairros e locais' if detailed else 'Total municipal'
        detailed_count += int(detailed)
        # Não confunde ausência de RDV com zero votos.
        cities_by_uf[uf].append(city)
        uf_verified[uf] += int(verified)
        audit.append(dict(uf=uf,municipio=mun,situacao=status,cargos=checks))
        for cargo,h in hist.items():
            uf_hist[uf][cargo].update(h)
        if not detailed:
            for stale in (DEST/'cidades'/uf/f'{mun}.json',DEST/'explorar'/uf/f'{mun}.json'):
                if stale.exists():
                    stale.unlink()
            continue
        locals_out = []
        # O 2º turno nos bairros do 1º turno: o local do RDV (número original) acha o bairro dele lá.
        aligned = defaultdict(Counter)
        aligned_base = Counter()
        aligned_out = Counter()
        neighborhood_hist = defaultdict(lambda:defaultdict(Counter))
        neighborhood_names = {}
        neighborhood_locals = Counter()
        neighborhood_sections = Counter()
        for key,h in locals_by_city[uf,mun].items():
            loc = places.get(key,dict(zona=key[2],local=key[3],nome='Local sem correspondência no cadastro',endereco='',bairro='Bairro não identificado',bairro_id='sem-bairro',origem='Não identificado',localizacao='Local não encontrado no cadastro',lat=None,lon=None))
            # uf, município e cidade são os do arquivo; repetir em cada linha só pesa.
            loc = {k:v for k,v in loc.items() if k not in ('uf','municipio','cidade')}
            if loc.get('localizacao') == LOCALIZACAO_PADRAO:
                loc['localizacao'] = None
            originals = sorted(local_originals[key])
            links = sorted(local_links[key])
            out = dict(loc,secoes_lidas=local_read[key],
                       locais_rdv=', '.join(map(str,originals)) if originals != [key[3]] else None,
                       vinculo_local='; '.join(links) if links != [VINCULO_PADRAO] else None,
                       **fields(h))
            # Local transferido: soma o 1º turno de todos os números originais; se faltar um, não há referência.
            refs = [first_places.get((mun,key[2],o)) for o in originals]
            homes = {first_neighborhoods.get((mun,key[2],o)) for o in originals}
            if len(homes) == 1 and None not in homes and all(r is not None for r in refs):
                home = homes.pop()
                out['bairro_1t'] = home
                for cargo,v in h.items():
                    a = amounts(v)
                    suffix = '' if cargo == '1' else '_gov'
                    for campo in ('votos','nulos','nulos14'):
                        aligned[home][f't2_{campo}{suffix}'] += a[campo]
                aligned_base[home] += sum(refs)
            else:
                out['bairro_1t'] = None
                aligned_out['t2_votos_fora'] += amounts(h.get('1',Counter()))['votos']
            out['votos14_1t'] = sum(refs) if refs and all(r is not None for r in refs) else None
            locals_out.append(out)
        merge_cadastral(locals_out)
        neighborhood_first = defaultdict(int)
        neighborhood_first_missing = set()
        neighborhood_sources = defaultdict(set)
        for out in locals_out:
            key = (uf,mun,out['zona'],out['local'])
            # Um bairro, uma linha: a origem descreve a linha, não a separa.
            bkey = out['bairro_id']
            neighborhood_sources[bkey].add(out['origem'])
            neighborhood_names[bkey] = out['bairro']
            neighborhood_locals[bkey] += 1
            neighborhood_sections[bkey] += local_read[key]
            for cargo,v in locals_by_city[uf,mun][key].items():
                neighborhood_hist[bkey][cargo].update(v)
            if out['votos14_1t'] is None:
                neighborhood_first_missing.add(bkey)
            else:
                neighborhood_first[bkey] += out['votos14_1t']
        # Bairro com algum local sem referência do 1º turno fica sem ela: soma parcial engana a razão.
        neighborhoods = [dict(bairro_id=k,nome=neighborhood_names[k],origem=neighborhood_source(neighborhood_sources[k]),locais=neighborhood_locals[k],secoes_lidas=neighborhood_sections[k],**fields(h),votos14_1t=None if k in neighborhood_first_missing else neighborhood_first[k]) for k,h in neighborhood_hist.items()]
        aligned_rows.append((uf,mun,city,aligned,aligned_base,aligned_out))
        write(Path('cidades')/uf/f'{mun}.json',dict(cidade=city,bairros=table(sorted(neighborhoods,key=lambda r:r['nome'])),locais=table(sorted(locals_out,key=lambda r:r['nome']))))
    def ratio(rows, x='nulos14_1', n='votos14_1t'):
        ns = sum(r.get(n) or 0 for r in rows if r.get(n) is not None)
        return sum(r.get(x) or 0 for r in rows if r.get(n) is not None)/ns if ns else None
    uf_ratio = {uf:ratio(cities) for uf,cities in cities_by_uf.items()}
    k_city = prior_strength([(c.get('nulos14_1',0),c['votos14_1t'],uf_ratio[uf]) for uf,cities in cities_by_uf.items() for c in cities if c.get('votos14_1t')])
    for uf,cities in cities_by_uf.items():
        for c in cities:
            if c.get('votos14_1t') and c['secoes_esperadas'] > 0:
                c['t2_fiel_aj'] = shrink(c.get('nulos14_1',0),c['votos14_1t'],uf_ratio[uf],k_city)
    # Bairro: puxado para a cidade, com o peso estimado entre bairros da mesma cidade.
    bairro_items = []
    for uf,mun,city,aligned,base,_ in aligned_rows:
        p = ratio([dict(nulos14_1=v['t2_nulos14'],votos14_1t=base[k]) for k,v in aligned.items()])
        bairro_items += [(v['t2_nulos14'],base[k],p) for k,v in aligned.items()]
    k_neighborhood = prior_strength(bairro_items)
    for uf,mun,city,aligned,base,out in aligned_rows:
        p = ratio([dict(nulos14_1=v['t2_nulos14'],votos14_1t=base[k]) for k,v in aligned.items()])
        rows = [dict(bairro_chave=k,**v,t2_base14=base[k],t2_fiel_aj=shrink(v['t2_nulos14'],base[k],p,k_neighborhood)) for k,v in sorted(aligned.items())]
        write(Path('explorar')/uf/f'{mun}.json',dict(bairros=table(rows),**out))
    states = []
    national_hist = defaultdict(Counter)
    for uf in sorted(uf_names):
        cities = cities_by_uf[uf]
        hist = uf_hist[uf]
        expected = sum(c['secoes_esperadas'] for c in cities)
        read = sum(c['secoes_lidas'] for c in cities)
        checks = {cargo:check(h,official(uf,'',int(cargo))) for cargo,h in hist.items()}
        verified = len(cities)>0 and uf_verified[uf] == len(cities) and all(v=='Conferido' for v in checks.values())
        first_total = [c.get('votos14_1t') for c in cities if c['secoes_esperadas'] > 0]
        row = dict(uf=uf,nome=uf_names[uf],municipios=len(cities),municipios_conferidos=uf_verified[uf],secoes_nao_instaladas=sum(c['secoes_nao_instaladas'] for c in cities),secoes_esperadas=expected,secoes_lidas=read,situacao='Conferido' if verified else 'Pendente de conferência',**fields(hist))
        row['votos14_1t'] = sum(first_total) if first_total and all(v is not None for v in first_total) else None
        states.append(row)
        write(Path('uf')/f'{uf}.json',table(sorted(cities,key=lambda r:r['nome'])))
        for cargo,h in hist.items():
            national_hist[cargo].update(h)
    complete = all(r['situacao']=='Conferido' for r in states)
    total = dict(nome='Brasil e exterior',secoes_nao_instaladas=sum(r['secoes_nao_instaladas'] for r in states),secoes_esperadas=sum(r['secoes_esperadas'] for r in states),secoes_lidas=sum(r['secoes_lidas'] for r in states),situacao='Conferido' if complete else 'Pendente de conferência',**fields(national_hist))
    first_states = [r['votos14_1t'] for r in states]
    total['votos14_1t'] = sum(first_states) if all(v is not None for v in first_states) else None
    sources = [
        {'nome':'RDVs oficiais — arquivos transmitidos para totalização','url':'https://dadosabertos.tse.jus.br/dataset/resultados-2026-arquivos-transmitidos-para-totalizacao'},
        {'nome':'Especificação oficial do RDV','url':'https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/formato-arquivos-de-bu-rdv-e-assinatura-digital/@@download/file'},
        {'nome':'Cadastro dos locais de votação de 2026 — segundo turno','url':LOCAIS},
        {'nome':'Malha de bairros IBGE — Censo 2022','url':BAIRROS},
        {'nome':'Municípios e códigos IBGE — TSE','url':MUNICIPIOS},
        {'nome':'Totalização oficial de Presidente — segundo turno','url':'https://resultados.tse.jus.br/oficial/ele2026/6258/dados/br/br-c0001-e006258-u.json'},
        {'nome':'Totalização oficial de Presidente — primeiro turno (régua dos eliminados)','url':'https://resultados.tse.jus.br/oficial/ele2026/6257/dados/br/br-c0001-e006257-u.json'},
    ]
    first_summary = json.loads((FIRST/'resumo.json').read_bytes())
    neighborhood_coverage = dict(first_summary.get('bairrosCorte',{}),municipiosComBairros=detailed_count,criterio='Arquivo de bairro com linhas disponível para a cidade no primeiro turno')
    fidelity = dict(k_cidade=k_city,k_bairro=k_neighborhood,referencia=fidelity_reference(national_hist))
    write(Path('resumo.json'),dict(geradoEm=datetime.now(timezone.utc).isoformat(),brasil=total,ufs=states,fontes=sources,completo=complete,coberturaBairros=neighborhood_coverage,fidelidade=fidelity))
    uninstalled_sections = [s for s in missing if (s['uf'],s['municipio']) in uninstalled_cities]
    missing = [s for s in missing if (s['uf'],s['municipio']) not in uninstalled_cities]
    write(Path('conferencia.json'),dict(municipios=audit,secoes_pendentes=missing,secoes_nao_instaladas=uninstalled_sections))
    db.close()
    print(json.dumps(dict(total=total,ufs=len(states),pendentes=len(missing)),ensure_ascii=False),flush=True)


if __name__ == '__main__':
    run()
