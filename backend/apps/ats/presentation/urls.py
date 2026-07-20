from django.urls import path

from .views import AtsEvaluateView

urlpatterns = [path('evaluate', AtsEvaluateView.as_view(), name='ats-evaluate')]

