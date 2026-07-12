import type { Certificado } from '../../types/models'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { DateInput } from './DateInput'

interface Props {
  certificados: Certificado[]
  adicionar: (titulo?: string) => void
  atualizar: (id: string, patch: Partial<Certificado>) => void
  remover: (id: string) => void
  definirArquivo: (id: string, arquivo: File) => void
  removerArquivo: (id: string) => void
}

export function CertificadosSection({
  certificados,
  adicionar,
  atualizar,
  remover,
  definirArquivo,
  removerArquivo,
}: Props) {
  function separarTitulo(id: string, valor: string) {
    const partes = valor.split(',').map((item) => item.trim()).filter(Boolean)
    if (partes.length <= 1) return
    atualizar(id, { titulo: partes[0] })
    partes.slice(1).forEach((titulo) => adicionar(titulo))
  }

  return (
    <div className="flex flex-col gap-4">
      {certificados.length === 0 && (
        <p className="text-sm text-[var(--color-muted)]">
          Nenhum certificado adicionado. Use esta etapa para cursos e certificações; projetos publicados entram nos
          links profissionais.
        </p>
      )}

      {certificados.map((certificado, i) => (
        <Card key={certificado.idCertificado}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-muted)]">Certificado {i + 1}</span>
            <button
              onClick={() => remover(certificado.idCertificado)}
              className="text-xs font-medium text-[var(--color-score-low)] hover:underline"
            >
              Remover
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Curso ou certificação"
              placeholder="Ex: React do Zero, AWS Cloud Practitioner..."
              value={certificado.titulo}
              onChange={(e) => atualizar(certificado.idCertificado, { titulo: e.target.value })}
              onBlur={(e) => separarTitulo(certificado.idCertificado, e.target.value)}
            />
            <Input
              label="Instituição"
              placeholder="Ex: Alura, Coursera, DIO..."
              value={certificado.instituicao}
              onChange={(e) => atualizar(certificado.idCertificado, { instituicao: e.target.value })}
            />
            <Input
              label="Carga horária"
              placeholder="Ex: 20h, 40h..."
              value={certificado.cargaHoraria ?? ''}
              onChange={(e) => atualizar(certificado.idCertificado, { cargaHoraria: e.target.value })}
            />
            <DateInput
              label="Emissão"
              value={certificado.dataEmissao ?? ''}
              onChange={(valor) => atualizar(certificado.idCertificado, { dataEmissao: valor })}
            />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-ink)]">
                Imagem ou PDF do certificado (opcional)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const arquivo = e.target.files?.[0]
                  if (arquivo) definirArquivo(certificado.idCertificado, arquivo)
                }}
                className="block w-full text-sm text-[var(--color-ink-soft)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary-soft)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--color-primary-dark)]"
              />
              {certificado.nomeArquivo && (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-[var(--color-line)] px-3 py-2">
                  <span className="text-xs text-[var(--color-ink-soft)]">{certificado.nomeArquivo}</span>
                  <button
                    className="text-xs font-medium text-[var(--color-score-low)] hover:underline"
                    onClick={() => removerArquivo(certificado.idCertificado)}
                  >
                    Remover arquivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}

      <Button variant="secondary" onClick={() => adicionar()} className="self-start">
        + Adicionar certificado
      </Button>
    </div>
  )
}
