"""Authentication and permissions for the two audiences this app serves.

Scope 5.6 requires authenticated endpoints. The complication is that the two audiences
cannot share one mechanism:

* **Patrons** scan a QR code and never log in. They get a short-lived bearer token minted
  per dining session (`PatronSession`), which proves a request belongs to a session this
  server issued and pins writes to that session.
* **Staff** use the floor view, kitchen display, and analytics. Those read every table's
  activity and the whole event log, so they use real Django accounts via DRF's token auth.

Menu reads stay public: the splash screen needs the venue before a session exists, and a
menu carries nothing sensitive. Everything that writes, or that exposes trial data, is
authenticated.
"""

from rest_framework import permissions
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from menu.models import PatronSession


class PatronSessionUser:
    """A non-Django principal representing an authenticated patron session.

    DRF expects `request.user` to expose the `is_authenticated` flag; patrons have no
    Django account, so this stands in for one.
    """

    is_authenticated = True
    is_staff = False

    def __init__(self, session):
        self.session = session

    @property
    def session_id(self):
        return self.session.session_id

    def __str__(self):
        return f"patron:{self.session.session_id}"


class PatronSessionAuthentication(BaseAuthentication):
    """Authenticates `Authorization: Patron <token>`."""

    keyword = 'Patron'

    def authenticate(self, request):
        header = request.META.get('HTTP_AUTHORIZATION', '')
        if not header.startswith(f'{self.keyword} '):
            return None

        token = header[len(self.keyword) + 1:].strip()
        if not token:
            raise AuthenticationFailed('Patron token is missing.')

        try:
            session = PatronSession.objects.get(token=token)
        except PatronSession.DoesNotExist:
            raise AuthenticationFailed('Patron token is not valid.')

        if session.is_expired:
            raise AuthenticationFailed('Patron session has expired. Please rescan the table QR code.')

        return PatronSessionUser(session), session

    def authenticate_header(self, request):
        return self.keyword


class IsPatron(permissions.BasePermission):
    """Allows a patron session (staff may also act, e.g. when demoing a table)."""

    message = 'A patron session token is required. Scan the table QR code to start one.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (isinstance(user, PatronSessionUser) or user.is_staff))


class IsStaff(permissions.BasePermission):
    """Allows only real staff accounts — never a patron token."""

    message = 'Staff credentials are required for this view.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, 'is_staff', False))


class IsStaffOrReadOnly(permissions.BasePermission):
    """Public reads, staff-only writes. Used for the menu itself."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and getattr(user, 'is_staff', False))
