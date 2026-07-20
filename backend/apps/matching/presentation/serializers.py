from rest_framework import serializers


class MatchJobsSerializer(serializers.Serializer):
    candidate = serializers.DictField()
    jobs = serializers.ListField(child=serializers.DictField(), min_length=1, max_length=50)

