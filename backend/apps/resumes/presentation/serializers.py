from rest_framework import serializers

from apps.resumes.domain.validation import MAX_RESUME_BYTES


class ResumeAnalyzeSerializer(serializers.Serializer):
    resume = serializers.FileField()
    consent = serializers.BooleanField()

    def validate_resume(self, file):
        if file.size > MAX_RESUME_BYTES:
            raise serializers.ValidationError('O PDF ultrapassa o tamanho máximo permitido.')
        return file

    def validate_consent(self, value):
        if value is not True:
            raise serializers.ValidationError('Confirme o envio do currículo ao provedor de IA.')
        return value
