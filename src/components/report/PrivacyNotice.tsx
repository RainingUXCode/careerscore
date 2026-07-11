export function PrivacyNotice() {
  return (
    <div className="rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary-soft)] px-4 py-3">
      <p className="text-sm font-medium text-[var(--color-primary-bright)]">Modo sem login</p>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
        Seus dados ficam somente neste navegador. Nada é enviado a servidores, e o histórico local pode ser apagado
        limpando os dados do site.
      </p>
    </div>
  )
}
