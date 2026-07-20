from django.urls import path

from .views import MatchJobsView

urlpatterns = [path('jobs', MatchJobsView.as_view(), name='match-jobs')]
