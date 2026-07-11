import type { ReactNode } from 'react'
import type { CurriculoOtimizadoResult } from '../../types/engine'

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="mb-2 border-b border-neutral-300 pb-1 text-xs font-bold uppercase tracking-wide text-neutral-500">
        {titulo}
      </h3>
      {children}
    </section>
  )
}

export function CurriculoOtimizadoView({ curriculo }: { curriculo: CurriculoOtimizadoResult }) {
  const { contato, resumoProfissional, habilidadesTecnicas, projetos, experiencias, formacao, certificados, idiomas, links } =
    curriculo

  return (
    <div className="mx-auto max-w-3xl rounded-lg bg-white p-8 text-neutral-800 shadow-[0_1px_3px_rgba(0,0,0,0.3)] sm:p-10">
      <header className="mb-6 border-b border-neutral-300 pb-4">
        <h2 className="font-display text-2xl font-bold text-neutral-900">{contato.nome || 'Nome não informado'}</h2>
        <p className="mt-1 text-sm text-neutral-600">
          {[contato.email, contato.telefone, contato.localizacao].filter(Boolean).join(' · ') || 'Contato não informado'}
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {resumoProfissional && (
          <Secao titulo="Resumo profissional">
            <p className="text-sm leading-relaxed">{resumoProfissional}</p>
          </Secao>
        )}

        <Secao titulo="Habilidades técnicas">
          {habilidadesTecnicas.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma competência técnica cadastrada ainda.</p>
          ) : (
            <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm">
              {habilidadesTecnicas.map((habilidade, i) => (
                <span key={habilidade}>
                  {habilidade}
                  {i < habilidadesTecnicas.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          )}
        </Secao>

        <Secao titulo="Projetos">
          {projetos.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Nenhum projeto público com dados suficientes para incluir automaticamente ainda. Conecte um GitHub com
              repositórios descritos para essa seção ser preenchida.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {projetos.map((projeto) => (
                <li key={projeto.nome}>
                  <p className="text-sm font-semibold text-neutral-900">
                    {projeto.nome}
                    {projeto.tecnologias.length > 0 && (
                      <span className="font-normal text-neutral-500"> — {projeto.tecnologias.join(', ')}</span>
                    )}
                  </p>
                  <p className="text-sm text-neutral-700">{projeto.descricao}</p>
                  {projeto.url && (
                    <a href={projeto.url} target="_blank" rel="noreferrer" className="text-xs text-neutral-500 underline">
                      {projeto.url}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Experiência profissional">
          {experiencias.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma experiência cadastrada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {experiencias.map((exp, i) => (
                <li key={`${exp.empresa}-${i}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-sm font-semibold text-neutral-900">
                      {exp.cargo} — {exp.empresa}
                    </p>
                    <p className="text-xs text-neutral-500">{exp.periodo}</p>
                  </div>
                  {exp.pontos.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-sm text-neutral-700">
                      {exp.pontos.map((ponto, j) => (
                        <li key={j}>{ponto}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Formação">
          {formacao.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma formação cadastrada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {formacao.map((form, i) => (
                <li key={`${form.instituicao}-${i}`} className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm text-neutral-900">
                    <span className="font-semibold">{form.curso}</span> — {form.instituicao} ({form.nivel})
                  </p>
                  <p className="text-xs text-neutral-500">{form.periodo}</p>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        {certificados.length > 0 && (
          <Secao titulo="Certificados">
            <ul className="flex flex-col gap-1">
              {certificados.map((cert, i) => (
                <li key={`${cert.titulo}-${i}`} className="text-sm text-neutral-800">
                  <span className="font-semibold">{cert.titulo}</span> — {cert.instituicao}
                  {cert.cargaHoraria ? ` (${cert.cargaHoraria})` : ''}
                  {cert.competenciasDetectadas.length > 0 && (
                    <span className="text-neutral-500"> · {cert.competenciasDetectadas.join(', ')}</span>
                  )}
                </li>
              ))}
            </ul>
          </Secao>
        )}

        {idiomas.length > 0 && (
          <Secao titulo="Idiomas">
            <p className="text-sm text-neutral-800">
              {idiomas.map((idioma) => `${idioma.nome} (${idioma.nivel})`).join(' · ')}
            </p>
          </Secao>
        )}

        {links.length > 0 && (
          <Secao titulo="Links">
            <ul className="flex flex-col gap-1 text-sm">
              {links.map((link) => (
                <li key={link.url}>
                  <span className="text-neutral-500">{link.tipo}:</span>{' '}
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-neutral-800 underline">
                    {link.url}
                  </a>
                </li>
              ))}
            </ul>
          </Secao>
        )}
      </div>
    </div>
  )
}
