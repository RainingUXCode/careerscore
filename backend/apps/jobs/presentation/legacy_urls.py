from django.urls import path

from .views import JobSearchView

urlpatterns = [path('vagas', JobSearchView.as_view(), name='legacy-job-search')]
