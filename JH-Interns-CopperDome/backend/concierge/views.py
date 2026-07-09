from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Guest
from .serializers import GuestSerializer


class StatusView(APIView):
    def get(self, request):
        return Response({'message': 'Copper Dome Concierge API is available.'})


class GuestListView(APIView):
    def get(self, request):
        guests = Guest.objects.all()
        serializer = GuestSerializer(guests, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = GuestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
