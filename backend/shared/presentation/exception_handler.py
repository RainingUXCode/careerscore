from rest_framework.response import Response
from rest_framework.views import exception_handler

from shared.domain.errors import ApplicationError


def api_exception_handler(exc, context):
    if isinstance(exc, ApplicationError):
        return Response({'erro': exc.code, 'mensagem': exc.message}, status=exc.status_code)
    response = exception_handler(exc, context)
    if response is not None:
        return response
    return Response(
        {'erro': 'erro_interno', 'mensagem': 'O servidor não conseguiu processar a solicitação.'},
        status=500,
    )

