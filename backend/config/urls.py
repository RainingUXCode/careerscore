"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from shared.presentation.views import HealthView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', HealthView.as_view(), name='health'),
    path('api/v1/health', HealthView.as_view(), name='health-no-slash'),
    path('api/v1/resumes/', include('apps.resumes.presentation.urls')),
    path('api/v1/jobs/', include('apps.jobs.presentation.urls')),
    path('api/v1/ats/', include('apps.ats.presentation.urls')),
    path('api/v1/matching/', include('apps.matching.presentation.urls')),
    # Compatibilidade temporária com o frontend atual.
    path('api/', include('apps.jobs.presentation.legacy_urls')),
    path('api/', include('apps.resumes.presentation.legacy_urls')),
]
