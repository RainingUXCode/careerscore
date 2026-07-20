from rest_framework.response import Response
from rest_framework.views import exception_handler

from shared.domain.errors import ApplicationError


def api_exception_handler(exc, context):
    if isinstance(exc, ApplicationError):
        payload = {
            'error': {
                'code': exc.code,
                'message': exc.message,
                'details': exc.details,
            },
            'erro': exc.code,
            'mensagem': exc.message,
        }
        return Response(payload, status=exc.status_code)
    response = exception_handler(exc, context)
    if response is not None:
        return response
    return Response(
        {
            'error': {
                'code': 'erro_interno',
                'message': 'O servidor não conseguiu processar a solicitação.',
                'details': {},
            },
            'erro': 'erro_interno',
            'mensagem': 'O servidor não conseguiu processar a solicitação.',
        },
        status=500,
    )
