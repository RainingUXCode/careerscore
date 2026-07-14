import type { JobProvider, FiltroBuscaVagas, OpcoesBuscaProvider } from '../types/jobProvider'
import type { VagaNormalizada } from '../types/vaga'
import { MockJobProvider } from './providers/mockJobProvider'
import { JSearchJobProvider } from './providers/jsearchJobProvider'
import { deduplicarVagas } from './deduplicacaoVagasService'
import { vagasCacheService } from './vagasCacheService'

/**
 * Estado da fonte real nesta consulta — diferente de "usouFallback", que só
 * diz o que o usuário está vendo. Isso diferencia explicitamente "a fonte
 * real respondeu mas não achou nada" de "a fonte real falhou", que exigem
 * mensagens bem diferentes na interface.
 */
export type StatusFonteReal = 'com_vagas' | 'vazia' | 'falhou' | 'sem_provider_real'

export interface ResultadoAgregacaoVagas {
  vagas: VagaNormalizada[]
  /** Nomes dos providers que falharam nesta busca. */
  fontesComFalha: string[]
  /** Códigos de erro únicos reportados pelos providers que falharam (ex: 'chave_ausente', 'cota_excedida'). */
  codigosErro: string[]
  /** true quando só sobraram vagas de demonstração apesar de haver provider(s) real(is) configurado(s). */
  usouFallback: boolean
  /** true quando o resultado veio do cache local, sem nova requisição de rede. */
  deCache: boolean
  consultadoEm: string
  statusFonteReal: StatusFonteReal
}

export type OpcoesBuscaVagas = OpcoesBuscaProvider

export class JobAggregatorService {
  constructor(private readonly providers: JobProvider[]) {}

  async buscar(filtros: FiltroBuscaVagas, opcoes: OpcoesBuscaVagas = {}): Promise<ResultadoAgregacaoVagas> {
    if (!opcoes.forcarAtualizacao) {
      const emCache = vagasCacheService.obter(filtros)
      if (emCache) {
        return {
          vagas: emCache.vagas,
          fontesComFalha: [],
          codigosErro: [],
          usouFallback: emCache.vagas.length > 0 && emCache.vagas.every((vaga) => vaga.fonte.tipo === 'demonstracao'),
          deCache: true,
          consultadoEm: emCache.consultadoEm,
          // Resultado em cache sempre teve vagas reais quando foi salvo (ver
          // regra de gravação abaixo) — então, se chegou até aqui, a fonte
          // real respondeu com vagas nessa consulta original.
          statusFonteReal: 'com_vagas',
        }
      }
    }

    const execucoes = await Promise.all(
      this.providers.map(async (provider) => {
        try {
          const resultado = await provider.buscar(filtros, opcoes)
          return { provider, resultado }
        } catch (erro) {
          return { provider, resultado: { sucesso: false, vagas: [], erro: String(erro) } }
        }
      }),
    )

    const fontesComFalha: string[] = []
    const codigosErro = new Set<string>()
    const execucaoReal = execucoes.find(({ provider }) => provider.tipo === 'real')
    const sucessoReal = execucoes.some(
      ({ provider, resultado }) => provider.tipo === 'real' && resultado.sucesso && resultado.vagas.length > 0,
    )

    let vagas: VagaNormalizada[] = []
    let algumProviderRealTeveSucesso = false

    for (const { provider, resultado } of execucoes) {
      if (!resultado.sucesso) {
        fontesComFalha.push(provider.nome)
        if ('erro' in resultado && resultado.erro) codigosErro.add(resultado.erro)
        continue
      }
      // Mock só entra na lista quando nenhuma fonte real teve sucesso — nunca
      // mistura vaga de demonstração com vaga real "por baixo" silenciosamente.
      if (provider.tipo === 'demonstracao' && sucessoReal) continue

      if (provider.tipo === 'real' && resultado.vagas.length > 0) {
        algumProviderRealTeveSucesso = true
      }
      vagas.push(...resultado.vagas)
    }

    // Vagas encerradas/indisponíveis nunca são recomendadas.
    vagas = vagas.filter((vaga) => vaga.status !== 'encerrada' && vaga.status !== 'indisponivel')
    vagas = deduplicarVagas(vagas)
    vagas.sort((a, b) => new Date(b.dataPublicacao ?? 0).getTime() - new Date(a.dataPublicacao ?? 0).getTime())

    const existeProviderReal = this.providers.some((provider) => provider.tipo === 'real')
    const sobraramSoDemonstracao = vagas.length > 0 && vagas.every((vaga) => vaga.fonte.tipo === 'demonstracao')
    const usouFallback = existeProviderReal && sobraramSoDemonstracao

    const consultadoEm = new Date().toISOString()

    // Só cacheia quando uma fonte real de fato respondeu com vagas — uma
    // falha temporária (cota, timeout) OU uma resposta real vazia não devem
    // "travar" o app em modo demonstração/vazio por 24h; na próxima busca ele
    // tenta a fonte real de novo (a resposta vazia também já não é cacheada
    // na CDN de /api/vagas — ver Cache-Control condicional lá).
    if (algumProviderRealTeveSucesso) {
      vagasCacheService.salvar(filtros, vagas)
    }

    let statusFonteReal: StatusFonteReal
    if (!execucaoReal) {
      statusFonteReal = 'sem_provider_real'
    } else if (!execucaoReal.resultado.sucesso) {
      statusFonteReal = 'falhou'
    } else if (execucaoReal.resultado.vagas.length === 0) {
      statusFonteReal = 'vazia'
    } else {
      statusFonteReal = 'com_vagas'
    }

    return {
      vagas,
      fontesComFalha,
      codigosErro: Array.from(codigosErro),
      usouFallback,
      deCache: false,
      consultadoEm,
      statusFonteReal,
    }
  }
}

/**
 * Instância usada pela aplicação. O MockJobProvider continua sempre presente
 * como rede de segurança; o JSearchJobProvider é a primeira fonte real —
 * adicionar uma nova fonte no futuro é só incluir mais um item nesta lista,
 * sem mudar nenhum consumidor.
 */
export const jobAggregatorService = new JobAggregatorService([new JSearchJobProvider(), new MockJobProvider()])
