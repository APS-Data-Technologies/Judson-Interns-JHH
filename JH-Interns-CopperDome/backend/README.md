# Backend - JH-Interns-CopperDome

This directory contains the Django REST and WebSocket backend for the Copper Dome Concierge project.

## Overview

The backend scaffold supports:
- Django REST Framework API endpoints.
- Django Channels for WebSocket and real-time communication.
- PostgreSQL database connectivity.
- Environment variable configuration.

## Local Development

1. Create and activate a Python environment.
2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

4. Apply database migrations:
   ```bash
   python manage.py migrate
   ```

5. Run the development server:
   ```bash
   python manage.py runserver
   ```

## Key Files

- `backend/` - Main Django project directory.
- `requirements.txt` - Python dependencies.
- `.env.example` - Environment configuration template.

## Notes

Add Django app modules, API views, serializers, and Channels routing to build the concierge backend.
