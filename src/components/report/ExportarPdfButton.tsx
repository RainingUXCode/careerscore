import { Button } from '../ui/Button'
import { exportService } from '../../services/exportService'

/**
 * Exporta o relatório atual em PDF usando o diálogo de impressão do navegador
 * ("Salvar como PDF"), com uma folha de estilos dedicada para impressão
 * (ver @media print em index.css).
 */
export function ExportarPdfButton() {
  return (
    <Button variant="secondary" onClick={() => exportService.imprimirRelatorio()}>
      Exportar PDF
    </Button>
  )
}
