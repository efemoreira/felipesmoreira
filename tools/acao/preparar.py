#!/usr/bin/env python3
"""Prepara um pacote local para a central Ação; não publica documentos."""
import argparse
import csv
import json
import subprocess
from pathlib import Path


def preparar(manifesto_path: Path, saida: Path) -> dict:
    raiz = Path(__file__).resolve().parents[2]
    saida = saida.resolve()
    if saida.is_relative_to(raiz / "public"):
        raise ValueError("O pacote privado deve ficar fora de public/.")
    if saida.is_relative_to(raiz):
        ignorado = subprocess.run(["git", "check-ignore", "--quiet", str(saida)], cwd=raiz)
        if ignorado.returncode != 0:
            raise ValueError("Escolha uma saída ignorada pelo Git, como .local/organizacao/pacote-acao.json.")
    manifesto = json.loads(manifesto_path.read_text(encoding="utf-8"))
    documentos = []
    ids = set()
    for fonte in manifesto["documentos"]:
        arquivo = Path(fonte["caminho"])
        if not arquivo.is_absolute():
            arquivo = raiz / arquivo
        if arquivo.suffix.lower() != ".md" or fonte["id"] in ids:
            raise ValueError("Cada fonte deve ser Markdown e ter um identificador único.")
        ids.add(fonte["id"])
        documentos.append({
            "id": fonte["id"], "titulo": fonte["titulo"],
            "categoria": fonte.get("categoria", "Planejamento"),
            "resumo": fonte.get("resumo", ""), "arquivo": arquivo.name,
            "conteudo": arquivo.read_text(encoding="utf-8").replace("\r\n", "\n"),
        })
    diretorio = []
    if manifesto.get("diretorio"):
        arquivo_csv = Path(manifesto["diretorio"])
        if not arquivo_csv.is_absolute():
            arquivo_csv = raiz / arquivo_csv
        with arquivo_csv.open(encoding="utf-8-sig", newline="") as stream:
            diretorio = list(csv.DictReader(stream, delimiter=";"))
    pacote = {"versao": 1, "documentos": documentos, "diretorio": diretorio}
    bruto = json.dumps(pacote, ensure_ascii=False, indent=2) + "\n"
    if not 1 <= len(documentos) <= 40 or len(bruto.encode("utf-8")) > 5 * 1024 * 1024:
        raise ValueError("O pacote deve ter de 1 a 40 documentos e até 5 MB.")
    saida.parent.mkdir(parents=True, exist_ok=True)
    saida.write_text(bruto, encoding="utf-8")
    return {"pacote": str(saida), "documentos": len(documentos), "destinos": len(diretorio)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifesto", type=Path)
    parser.add_argument("saida", type=Path)
    argumentos = parser.parse_args()
    print(json.dumps(preparar(argumentos.manifesto, argumentos.saida), ensure_ascii=False))
