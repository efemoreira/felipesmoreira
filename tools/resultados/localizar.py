"""Local de votação do 2º turno → coordenada → bairro IBGE ou cadastro TSE.

Nunca geocodifica endereço por suposição e nunca identifica residência de eleitor.
"""
import io
import json
import zipfile
import geopandas as gpd
import pandas as pd

from coletar import CACHE, get

LOCAIS = 'https://cdn.tse.jus.br/estatistica/sead/odsele/eleitorado_locais_votacao/eleitorado_local_votacao_2026.zip'
BAIRROS = 'https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/malhas_de_setores_censitarios__divisoes_intramunicipais/censo_2022/bairros/shp/BR/BR_bairros_CD2022.zip'
MUNICIPIOS = 'https://resultados.tse.jus.br/oficial/ele2026/6258/config/mun-e006258-cm.json'


def run():
    CACHE.mkdir(exist_ok=True)
    for name,url in [('locais.zip',LOCAIS),('bairros.zip',BAIRROS),('municipios.json',MUNICIPIOS)]:
        if not (CACHE/name).exists():
            (CACHE/name).write_bytes(get(url))
    municipios = {(a['cd'],m['cd']):m['cdi'] for a in json.loads((CACHE/'municipios.json').read_text())['abr'] for m in a['mu']}
    archive = zipfile.ZipFile(CACHE/'locais.zip')
    cols = ['NR_TURNO','SG_UF','CD_MUNICIPIO','NM_MUNICIPIO','NR_ZONA','NR_SECAO','NR_LOCAL_VOTACAO_ORIGINAL','NR_LOCAL_VOTACAO','NM_LOCAL_VOTACAO','DS_ENDERECO','NM_BAIRRO','NR_LATITUDE','NR_LONGITUDE']
    rows = []
    for name in archive.namelist():
        if not name.endswith('.csv') or name.endswith('_BRASIL.csv'):
            continue
        with archive.open(name) as f:
            frame = pd.read_csv(f,sep=';',encoding='latin1',dtype=str,usecols=cols,keep_default_na=False)
        frame = frame[frame.NR_TURNO == '2'].drop_duplicates()
        rows.append(frame)
    all_rows = pd.concat(rows,ignore_index=True)
    if all_rows.empty:
        raise ValueError('Cadastro não contém locais do segundo turno')
    all_rows['uf'] = all_rows.SG_UF.str.lower()
    all_rows['municipio'] = all_rows.CD_MUNICIPIO.str.zfill(5)
    all_rows['zona'] = all_rows.NR_ZONA.astype(int)
    all_rows['local'] = all_rows.NR_LOCAL_VOTACAO.astype(int)
    section_rows = all_rows[['uf','municipio','zona','NR_SECAO','local','NR_LOCAL_VOTACAO_ORIGINAL']].drop_duplicates()
    section_map = []
    for key,group in section_rows.groupby(['uf','municipio','zona','NR_SECAO']):
        options = set(zip(group.local,group.NR_LOCAL_VOTACAO_ORIGINAL.astype(int)))
        if len(options) == 1:
            local,original = next(iter(options))
            section_map.append([key[0],key[1],int(key[2]),int(key[3]),int(local),int(original)])
    (CACHE/'secoes-locais.json').write_text(json.dumps(section_map,separators=(',',':')),encoding='utf8')
    all_rows = all_rows.drop(columns=['NR_SECAO','NR_LOCAL_VOTACAO_ORIGINAL']).drop_duplicates()
    keys = ['uf','municipio','zona','local']
    # Divergência no mesmo local não é resolvida escolhendo a primeira linha.
    counts = all_rows.groupby(keys).size()
    conflicts = set(counts[counts>1].index)
    places = all_rows.drop_duplicates(keys).copy()
    places['ibge'] = [municipios.get((r.uf,r.municipio),'') for r in places.itertuples()]
    places['lat'] = pd.to_numeric(places.NR_LATITUDE.str.replace(',','.',regex=False),errors='coerce')
    places['lon'] = pd.to_numeric(places.NR_LONGITUDE.str.replace(',','.',regex=False),errors='coerce')
    good = places.lat.between(-90,90) & places.lon.between(-180,180) & (places.lat != -1) & (places.lon != -1) & ((places.lat != 0) | (places.lon != 0))
    points = gpd.GeoDataFrame(places[good], geometry=gpd.points_from_xy(places.loc[good,'lon'],places.loc[good,'lat']),crs='EPSG:4326')
    polygons = gpd.read_file(CACHE/'bairros.zip').to_crs(points.crs)
    joined = gpd.sjoin(points,polygons[['CD_MUN','CD_BAIRRO','NM_BAIRRO','geometry']].rename(columns={'NM_BAIRRO':'bairro_ibge'}),predicate='intersects',how='inner')
    joined = joined[joined.ibge == joined.CD_MUN]
    # Ponto em fronteira de dois bairros permanece com o cadastro TSE.
    unique = joined[~joined.index.duplicated(keep=False)]
    matches = {i:r for i,r in unique.iterrows()}
    output = []
    for i,r in places.iterrows():
        key = (r.uf,r.municipio,int(r.zona),int(r.local))
        conflict = key in conflicts
        cadastral = r.NM_BAIRRO.strip()
        if cadastral in ('#NULO#','#NE#','-1'):
            cadastral = ''
        match = matches.get(i) if not conflict else None
        source = 'IBGE · coordenada' if match is not None else 'TSE · cadastro' if cadastral and not conflict else 'Não identificado'
        bairro = match.bairro_ibge if match is not None else cadastral if not conflict else ''
        bairro_id = str(match.CD_BAIRRO) if match is not None else 'tse:'+cadastral.upper() if bairro else 'sem-bairro'
        reason = 'Cadastro divergente' if conflict else 'Sem coordenadas válidas' if not good.loc[i] else 'Coordenada em bairro IBGE' if match is not None else 'Sem correspondência única na malha de bairros'
        output.append(dict(uf=r.uf,municipio=r.municipio,cidade=r.NM_MUNICIPIO,zona=int(r.zona),local=int(r.local),nome=r.NM_LOCAL_VOTACAO,endereco=r.DS_ENDERECO,bairro=bairro or 'Bairro não identificado',bairro_id=bairro_id,origem=source,localizacao=reason,lat=float(r.lat) if good.loc[i] and not conflict else None,lon=float(r.lon) if good.loc[i] and not conflict else None))
    (CACHE/'locais-bairros.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')),encoding='utf8')
    print(f'{len(output)} locais: '+str(pd.Series([r['origem'] for r in output]).value_counts().to_dict()),flush=True)


if __name__ == '__main__':
    run()
