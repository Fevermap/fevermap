# Push API

The Push API of fevermap is a small microservice responsible for handling push notifications for users around the world.

The API exposes two endpoints:

`/register` registers the user to receive a push notification at 18:00 their local time.
The endpoint takes a `SubscriptionObject` as a parameter, containing the a `registrationToken` gained from the front-end part of firebase and a topic, which determines the timezone of the user. The topic is in the form "UTCXXXX", where XXXX is the timezone offset in minutes. For example in Finland (UTC+3 at the moment), it's UTC-180.

`/unsubscribe` unsubscribes the user from receiving push notifications. The Unsubscribe endpoint take sthe same `SubscriptionObject` as a parameter as the `/register` endpoint.



### Sending push messages

The service runs a timer that triggers every minute, and in a situtation, that the UTC time matches with a existing timezone, it send a push notification to all of the users subscribed to push notifications of that timezone.

The push messages are handled by the Firebase Messaging service in the [Service Worker](https://gitlab.com/fevermap/fevermap/-/blob/master/app/src/service-worker.js#L162) class.

To read more about how firebase works and handles the notifications, go to [The Firebase messaging documentation](https://firebase.google.com/docs/cloud-messaging/js/receive)
