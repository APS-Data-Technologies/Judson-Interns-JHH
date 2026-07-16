from unittest.mock import MagicMock, patch

from django.test import TestCase
from rest_framework.test import APIClient

from menu.models import EventLog

from .models import ServiceRequest


class ServiceRequestApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_service_request_logs_event(self):
        response = self.client.post(
            '/api/service-requests/',
            {
                'session_id': 'session-abc',
                'table_number': '04',
                'request_type': 'water',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(ServiceRequest.objects.count(), 1)
        event = EventLog.objects.get(event_type='service_request_created')
        self.assertEqual(event.metadata['request_type'], 'water')
        self.assertEqual(event.metadata['table_number'], '04')

    def test_list_service_requests_filters_by_status(self):
        ServiceRequest.objects.create(session_id='s1', table_number='01', request_type='call_server', status='pending')
        ServiceRequest.objects.create(session_id='s2', table_number='02', request_type='check', status='resolved')

        response = self.client.get('/api/service-requests/', {'status': 'pending'})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]['request_type'], 'call_server')

    def test_patch_service_request_updates_status(self):
        instance = ServiceRequest.objects.create(
            session_id='s1', table_number='01', request_type='surprise_me', status='pending'
        )

        response = self.client.patch(
            f'/api/service-requests/{instance.id}/', {'status': 'resolved'}, format='json'
        )

        self.assertEqual(response.status_code, 200)
        instance.refresh_from_db()
        self.assertEqual(instance.status, 'resolved')


class ConciergeAskApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('concierge.views.ask_concierge')
    def test_ask_returns_reply_and_logs_event(self, mock_ask_concierge):
        mock_ask_concierge.return_value = 'The chowder pairs nicely with our sourdough.'

        response = self.client.post(
            '/api/concierge/ask/',
            {'session_id': 'session-abc', 'message': 'What pairs with the chowder?'},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['reply'], 'The chowder pairs nicely with our sourdough.')
        event = EventLog.objects.get(event_type='ai_question_asked')
        self.assertEqual(event.session_id, 'session-abc')

    def test_ask_requires_message(self):
        response = self.client.post('/api/concierge/ask/', {'session_id': 'session-abc'}, format='json')
        self.assertEqual(response.status_code, 400)

    @patch('concierge.views.ask_concierge')
    def test_ask_handles_anthropic_error(self, mock_ask_concierge):
        import anthropic

        mock_ask_concierge.side_effect = anthropic.APIConnectionError(request=MagicMock())

        response = self.client.post(
            '/api/concierge/ask/',
            {'session_id': 'session-abc', 'message': 'Hello'},
            format='json',
        )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(EventLog.objects.filter(event_type='ai_question_asked').count(), 0)
