from shared.domain.errors import ApplicationError

from .entities import ResumeDocument

MAX_RESUME_BYTES = 10 * 1024 * 1024


def validate_resume(document: ResumeDocument) -> None:
    if document.size == 0:
        raise ApplicationError('arquivo_vazio', 'O PDF enviado está vazio.', 400)
    if document.size > MAX_RESUME_BYTES:
        raise ApplicationError('arquivo_muito_grande', 'O PDF ultrapassa o tamanho máximo permitido.', 413)
    if document.mime_type != 'application/pdf':
        raise ApplicationError('mime_invalido', 'O arquivo precisa ser um PDF válido.', 400)
    if not document.filename.lower().endswith('.pdf'):
        raise ApplicationError('extensao_invalida', 'A extensão do arquivo precisa ser .pdf.', 400)
    if not document.content.startswith(b'%PDF'):
        raise ApplicationError('pdf_invalido', 'O arquivo enviado não parece ser um PDF válido.', 400)

