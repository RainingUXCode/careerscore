from rest_framework import serializers


class JobSearchQuerySerializer(serializers.Serializer):
    roles = serializers.CharField(required=False, allow_blank=True, max_length=480)
    cargo = serializers.CharField(required=False, allow_blank=True, max_length=480)
    termo = serializers.CharField(required=False, allow_blank=True, max_length=80)
    area = serializers.CharField(required=False, allow_blank=True, max_length=80)
    cidade = serializers.CharField(required=False, allow_blank=True, max_length=60)
    estado = serializers.CharField(required=False, allow_blank=True, max_length=60)
    pais = serializers.CharField(required=False, allow_blank=True, max_length=60, default='Brasil')
    modalidade = serializers.CharField(required=False, allow_blank=True, max_length=30)
    page = serializers.IntegerField(required=False, min_value=1, max_value=5)
    pagina = serializers.IntegerField(required=False, min_value=1, max_value=5)

