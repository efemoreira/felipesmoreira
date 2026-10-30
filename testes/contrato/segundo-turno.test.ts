import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../public/contagem-2026-2t");
const ler = (p: string) => JSON.parse(readFileSync(path.join(BASE,p),"utf8"));
type Registro = Record<string, number | string | null>;
const expandir = (t: { colunas: string[]; linhas: (number | string | null)[][] }): Registro[] => t.linhas.map((r) => Object.fromEntries(t.colunas.map((c,i) => [c,r[i]])));
const existe = existsSync(path.join(BASE,"resumo.json"));

describe("segundo turno: contagem e localização publicadas",{skip:!existe},() => {
  test("28 UFs/localidades, fontes oficiais e totais nacionais fecham com os estados",() => {
    const r = ler("resumo.json");
    assert.equal(r.ufs.length,28);
    assert.equal(new Set(r.ufs.map((u: Registro) => u.uf)).size,28);
    assert.ok(r.ufs.some((u: Registro) => u.uf === "zz"));
    assert.ok(r.fontes.every((f: { url: string }) => /\.(tse\.jus\.br|ibge\.gov\.br)$/.test(new URL(f.url).hostname)));
    for (const cargo of [1,3]) for (const campo of ["votos","nulos","nulos14","brancos","nominais"]) {
      const k = `${campo}_${cargo}`;
      assert.equal(r.ufs.reduce((s: number,u: Registro) => s+Number(u[k] ?? 0),0),r.brasil[k] ?? 0,k);
    }
    assert.equal(r.completo,r.ufs.every((u: Registro) => u.situacao === "Conferido"));
  });

  test("municípios, bairros e locais preservam contagens e o recorte real do primeiro turno",() => {
    const r = ler("resumo.json");
    for (const uf of r.ufs) {
      const cities = expandir(ler(`uf/${uf.uf}.json`));
      assert.equal(cities.length,uf.municipios);
      for (const cargo of [1,3]) assert.equal(cities.reduce((s,c) => s+Number(c[`nulos14_${cargo}`] ?? 0),0),uf[`nulos14_${cargo}`] ?? 0);
      for (const city of cities) {
        const first = path.resolve(BASE,"../resultados-2026/bairros",String(uf.uf),`${city.municipio}.json`);
        const hadDetails = existsSync(first) && Boolean(JSON.parse(readFileSync(first,"utf8")).bairros?.linhas?.length);
        assert.equal(city.recorte,hadDetails ? "Bairros e locais" : "Total municipal");
        if (!hadDetails) {
          assert.ok(!existsSync(path.join(BASE,`cidades/${uf.uf}/${city.municipio}.json`)),"cidade sem recorte por bairro não deve exportar detalhamento");
          continue;
        }
        const detail = ler(`cidades/${uf.uf}/${city.municipio}.json`);
        const neighborhoods = expandir(detail.bairros);
        const places = expandir(detail.locais);
        assert.equal(detail.cidade.situacao,city.situacao);
        for (const cargo of [1,3]) {
          const k = `nulos14_${cargo}`;
          assert.equal(neighborhoods.reduce((s,b) => s+Number(b[k] ?? 0),0),city[k] ?? 0,`${uf.uf}/${city.municipio}: bairros`);
          assert.equal(places.reduce((s,b) => s+Number(b[k] ?? 0),0),city[k] ?? 0,`${uf.uf}/${city.municipio}: locais`);
          if (typeof city[k] === "number") assert.ok(city[k] <= Number(city[`nulos_${cargo}`]));
        }
        // Um bairro, uma linha: a origem descreve, não separa.
        assert.equal(new Set(neighborhoods.map((b) => b.bairro_id)).size,neighborhoods.length,`${uf.uf}/${city.municipio}: bairro repetido`);
        const semAcento = (s: unknown) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
        const cadastrais = neighborhoods.filter((b) => b.origem === "TSE · cadastro").map((b) => semAcento(b.nome));
        assert.equal(new Set(cadastrais).size,cadastrais.length,`${uf.uf}/${city.municipio}: bairro do cadastro repetido por grafia`);
        assert.equal(new Set(places.map((p) => `${p.zona}/${p.local}`)).size,places.length);
        for (const p of places) {
          assert.ok(["IBGE · coordenada","IBGE · nome do cadastro","TSE · cadastro","Não identificado"].includes(String(p.origem)));
          for (const campo of ["telefone","uf","municipio","cidade"]) assert.ok(!(campo in p),campo);
          if (p.origem === "IBGE · coordenada") assert.ok(typeof p.lat === "number" && typeof p.lon === "number" && p.bairro_id !== "sem-bairro");
          if (p.locais_rdv !== null) assert.notEqual(String(p.locais_rdv),String(p.local),"locais_rdv só quando difere do local");
          assert.ok(neighborhoods.some((b) => b.bairro_id === p.bairro_id));
        }
        // Referência do 1º turno: soma dos locais quando todos têm par; senão, ausente.
        for (const b of neighborhoods) {
          if (b.votos14_1t === null) continue;
          const dele = places.filter((p) => p.bairro_id === b.bairro_id);
          assert.ok(dele.every((p) => p.votos14_1t !== null));
          assert.equal(dele.reduce((s,p) => s+Number(p.votos14_1t),0),b.votos14_1t);
        }
        if (city.situacao === "Conferido") assert.equal(city.secoes_lidas,city.secoes_esperadas);
      }
    }
  });

  test("a régua dos eliminados começa no 14 e o ajuste tem peso estimado",() => {
    const f = ler("resumo.json").fidelidade;
    assert.ok(f.k_cidade > 0 && f.k_bairro > 0);
    assert.equal(f.referencia[0].numero,"14");
    for (const r of f.referencia) {
      assert.ok(r.votos_1t >= 100000,"número pequeno coincide com digitação comum");
      assert.equal(r.por100,Math.round(10000*r.nulos_2t/r.votos_1t)/100);
    }
  });

  test("o 2º turno nos bairros do 1º: um arquivo por cidade com bairro, chaves de lá, votos fechando com a cidade",() => {
    const r = ler("resumo.json");
    for (const uf of r.ufs) for (const city of expandir(ler(`uf/${uf.uf}.json`))) {
      const alinhado = path.join(BASE,`explorar/${uf.uf}/${city.municipio}.json`);
      assert.equal(existsSync(alinhado),city.recorte === "Bairros e locais",`${uf.uf}/${city.municipio}`);
      if (!existsSync(alinhado)) continue;
      const e = JSON.parse(readFileSync(alinhado,"utf8"));
      const primeiro = new Set(expandir(JSON.parse(readFileSync(path.resolve(BASE,"../resultados-2026/bairros",String(uf.uf),`${city.municipio}.json`),"utf8")).bairros).map((b) => b.bairro_chave));
      const bairros = expandir(e.bairros);
      assert.ok(bairros.every((b) => primeiro.has(b.bairro_chave)),`${uf.uf}/${city.municipio}: chave fora do 1º turno`);
      assert.equal(bairros.reduce((s,b) => s+Number(b.t2_votos),0)+(e.t2_votos_fora ?? 0),city.votos_1,`${uf.uf}/${city.municipio}`);
      for (const b of bairros) if (b.t2_fiel_aj !== null) assert.ok(Number(b.t2_fiel_aj) > 0 && Number(b.t2_fiel_aj) < 1);
      const locais = expandir(ler(`cidades/${uf.uf}/${city.municipio}.json`).locais);
      assert.ok(locais.every((l) => l.bairro_1t === null || primeiro.has(l.bairro_1t)));
    }
  });

  test("o 14 do 1º turno no município é o mesmo de /resultados",() => {
    const r = ler("resumo.json");
    for (const uf of r.ufs) {
      const primeiro = path.resolve(BASE,"../resultados-2026/uf",`${uf.uf}.json`);
      if (!existsSync(primeiro)) continue;
      const base = new Map(expandir(JSON.parse(readFileSync(primeiro,"utf8")).cidades).map((c) => [String(c.municipio_codigo).padStart(5,"0"),c.missao_pres]));
      for (const c of expandir(ler(`uf/${uf.uf}.json`))) if (base.has(String(c.municipio))) assert.equal(c.votos14_1t,base.get(String(c.municipio)),`${uf.uf}/${c.municipio}`);
    }
  });

  test("o novo conjunto permanece abaixo de 40 MB",() => {
    const tamanho = (p: string): number => readdirSync(p).reduce((s,n) => { const f=path.join(p,n);return s+(statSync(f).isDirectory()?tamanho(f):statSync(f).size); },0);
    assert.ok(tamanho(BASE) < 40e6);
  });
});
