from rest_framework import serializers


class AtsEvaluateSerializer(serializers.Serializer):
    profile = serializers.DictField()
    resumeText = serializers.CharField(required=False, allow_blank=True, max_length=100_000)

