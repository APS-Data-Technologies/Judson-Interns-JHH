import secrets
import uuid
from datetime import timedelta

from django.db import models
from django.utils import timezone


class Venue(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=500)
    configuration = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'venues'

    def __str__(self):
        return self.name


class Kitchen(models.Model):
    venue = models.ForeignKey(Venue, related_name='kitchens', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    cuisine_type = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    kitchen = models.ForeignKey(Kitchen, related_name='menu_items', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.CharField(max_length=100)
    dietary_tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class EventLog(models.Model):
    EVENT_TYPES = [
        ('session_started', 'session_started'),
        ('menu_viewed', 'menu_viewed'),
        ('menu_item_viewed', 'menu_item_viewed'),
        ('ai_question_asked', 'ai_question_asked'),
        ('item_added_to_cart', 'item_added_to_cart'),
        ('mock_checkout_started', 'mock_checkout_started'),
        ('mock_checkout_completed', 'mock_checkout_completed'),
        ('service_request_created', 'service_request_created'),
    ]

    event_type = models.CharField(max_length=64, choices=EVENT_TYPES)
    session_id = models.CharField(max_length=255, blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} @ {self.timestamp:%Y-%m-%d %H:%M}"


class PatronSession(models.Model):
    """A QR-entry dining session, and the bearer token that authenticates it.

    Scope 5.6 requires authenticated endpoints, but patrons scan a QR code and never log
    in -- so the app mints a short-lived token per session instead. It carries no personal
    data, only proves that a request belongs to a session this server actually issued, and
    binds writes to that session so one table cannot post events as another.
    """

    TOKEN_TTL = timedelta(hours=6)

    session_id = models.CharField(max_length=255, unique=True)
    token = models.CharField(max_length=64, unique=True, db_index=True)
    table_number = models.CharField(max_length=32)
    created_at = models.DateTimeField(default=timezone.now)
    last_seen_at = models.DateTimeField(default=timezone.now)

    # "Real patrons opt in; event logging is on" (scope, Live Trial). Defaults to False so
    # a patron who never answers is never instrumented -- consent is given, not assumed.
    analytics_opt_in = models.BooleanField(default=False)
    consent_recorded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"session {self.session_id} (table {self.table_number})"

    @property
    def is_expired(self):
        return timezone.now() - self.created_at > self.TOKEN_TTL

    @classmethod
    def issue(cls, table_number, analytics_opt_in=False):
        return cls.objects.create(
            session_id=str(uuid.uuid4()),
            token=secrets.token_urlsafe(32),
            table_number=table_number or '',
            analytics_opt_in=bool(analytics_opt_in),
            consent_recorded_at=timezone.now(),
        )

    def log_event(self, event_type, metadata=None):
        """Write a trial event, but only with this patron's consent.

        Every event write goes through here so opting out cannot be bypassed by a caller
        that forgets to check. Returns the row, or None when the patron declined.
        """
        if not self.analytics_opt_in:
            return None
        return EventLog.objects.create(
            event_type=event_type,
            session_id=self.session_id,
            metadata=metadata or {},
        )


class Order(models.Model):
    """A simulated order.

    Nothing here is ever charged -- checkout is mocked (scope 4). The row exists so the
    mock kitchen-display that stands in for Toast/Incentivio has tickets to show, and so
    the floor view can tell a seated table from an empty one.
    """

    STATUSES = [
        ('placed', 'placed'),
        ('preparing', 'preparing'),
        ('ready', 'ready'),
        ('served', 'served'),
        # The simulated payment failure (scope 3.1). Recorded rather than discarded so the
        # patron can see what happened and the trial can count failed attempts.
        ('declined', 'declined'),
    ]

    # Still moving through the kitchen — everything the floor and the patron care about.
    ACTIVE_STATUSES = ['placed', 'preparing', 'ready']

    session_id = models.CharField(max_length=255)
    table_number = models.CharField(max_length=32)
    status = models.CharField(max_length=16, choices=STATUSES, default='placed')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order #{self.pk} -- table {self.table_number} ({self.status})"


class OrderItem(models.Model):
    """A line on an order.

    Name, price and kitchen are snapshotted rather than followed by FK so a ticket still
    reads correctly if the menu is edited mid-service.
    """

    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    menu_item = models.ForeignKey(MenuItem, null=True, blank=True, on_delete=models.SET_NULL)
    kitchen = models.ForeignKey(Kitchen, null=True, blank=True, on_delete=models.SET_NULL)
    kitchen_name = models.CharField(max_length=255, blank=True)
    name = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity}x {self.name}"
