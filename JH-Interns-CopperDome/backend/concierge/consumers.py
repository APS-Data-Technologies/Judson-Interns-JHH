from channels.generic.websocket import AsyncJsonWebsocketConsumer

STAFF_FEED_GROUP = 'staff_feed'


class StaffFeedConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(STAFF_FEED_GROUP, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(STAFF_FEED_GROUP, self.channel_name)

    async def staff_request(self, event):
        await self.send_json(event['payload'])
