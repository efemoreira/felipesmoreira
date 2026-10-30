"""Testes do contrato de leitura do RDV, sem rede."""
import unittest
from collections import Counter
from copy import deepcopy
from coletar import SPEC, decode
from exportar import amounts, check


def entity():
    return {
        'cabecalho': {'dataGeracao':'20261025T170000','idEleitoral':('idPleito',3221)},
        'urna': {
            'tipoUrna':1,'versaoVotacao':'teste',
            'correspondenciaResultado': {
                'identificacao':('identificacaoSecaoEleitoral', {'municipioZona':{'municipio':13897,'zona':1},'local':1234,'secao':33}),
                'carga':{'numeroInternoUrna':1,'numeroSerieFC':b'1234','identificadorGeradorMidia':{'nome':'teste','serialCertificadoTPM':'teste','serialInstalacao':'teste'},'dataHoraCarga':'20261001T120000','codigoCarga':'teste'},
            },
            'tipoArquivo':1,'numeroSerieFV':b'1234',
        },
        'rdv': {
            'pleito':3221,'fase':2,
            'identificacao': {'municipioZona':{'municipio':13897,'zona':1},'local':1234,'secao':33},
            'historicoCodigosCarga':[],
            'eleicoes':('eleicoesVota',[{'idEleicao':6258,'votosCargos':[{'idCargo':('cargoConstitucional',1),'quantidadeEscolhas':1,'votos':[
                {'tipoVoto':4,'digitacao':'14'}, {'tipoVoto':4,'digitacao':'99'},
                {'tipoVoto':2,'digitacao':'14'}, {'tipoVoto':3}, {'tipoVoto':6},
            ]}]}]),
        },
    }


class RdvTest(unittest.TestCase):
    def test_conta_apenas_tipo_nulo_e_digitacao_exata(self):
        raw = SPEC.encode('EntidadeResultadoRDV',entity())
        result = decode(raw,'13897','0001','0033')
        self.assertEqual(result['local'],1234)
        self.assertEqual(amounts(result['cargos']['1']),dict(votos=5,nulos=3,brancos=1,nominais=1,nulos14=1))

    def test_rejeita_outro_pleito_fase_e_identidade(self):
        for key,value in [('pleito',3220),('fase',1)]:
            e = entity()
            e['rdv'][key] = value
            with self.assertRaises(ValueError): decode(SPEC.encode('EntidadeResultadoRDV',e),'13897','0001','0033')
        with self.assertRaises(ValueError): decode(SPEC.encode('EntidadeResultadoRDV',entity()),'13897','0002','0033')

    def test_separa_cargos_e_rejeita_bytes_extras(self):
        e = entity()
        gov = deepcopy(e['rdv']['eleicoes'][1][0])
        gov['idEleicao'] = 6260
        gov['votosCargos'][0]['idCargo'] = ('cargoConstitucional',3)
        e['rdv']['eleicoes'][1].append(gov)
        raw = SPEC.encode('EntidadeResultadoRDV',e)
        result = decode(raw,'13897','0001','0033')
        self.assertEqual(set(result['cargos']),{'1','3'})
        with self.assertRaises(ValueError): decode(raw+b'\x00','13897','0001','0033')

    def test_nao_mistura_consultas_ou_eleicoes_suplementares(self):
        e = entity()
        other = deepcopy(e['rdv']['eleicoes'][1][0])
        other['idEleicao'] = 6288
        other['votosCargos'][0]['idCargo'] = ('numeroCargoConsultaLivre',26)
        e['rdv']['eleicoes'][1].append(other)
        result = decode(SPEC.encode('EntidadeResultadoRDV',e),'13897','0001','0033')
        self.assertEqual(set(result['cargos']),{'1'})
        self.assertEqual(amounts(result['cargos']['1'])['nulos14'],1)

    def test_conferencia_exige_totais_e_votacao_nominal(self):
        p = {'tf':'s','v':{'tv':'4','tvn':'2','vb':'1','vnom':'1'},'carg':[{'agr':[{'par':[{'cand':[{'n':'13','vap':'1'}]}]}]}]}
        hist = Counter({'4:14':1,'4:99':1,'3:':1,'2:13':1})
        self.assertEqual(check(hist,p),'Conferido')
        self.assertEqual(check(Counter({'4:14':2,'3:':1,'2:22':1}),p),'Divergência na conferência nominal')
        self.assertEqual(check(Counter({'4:14':1}),p),'Divergência nos totais')


if __name__ == '__main__':
    unittest.main()
