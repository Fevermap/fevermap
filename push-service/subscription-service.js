const admin = require("firebase-admin");

class SubscriptionService {
  static getInstance() {
    return SubscriptionService._instance
      ? SubscriptionService._instance
      : new SubscriptionService();
  }

  constructor() {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: "https://fevermap-95d71.firebaseio.com"
    });
    SubscriptionService._instance = this;
  }

  createMessage(topic) {
    return { topic, data: { timestamp: Date.now().toString() } };
  }

  subscribeUserToTopic(subscriptionObject, res) {
    console.log(
      `Subscribing token ${subscriptionObject.registrationToken} to topic ${subscriptionObject.topic}`
    );
    admin
      .messaging()
      .subscribeToTopic(
        [subscriptionObject.registrationToken],
        subscriptionObject.topic
      )
      .then(subResponse => {
        console.log(subResponse);
        res.json({ success: true });
      })
      .catch(err => {
        res.json({ success: false, message: err });
      });
  }

  sendMessage(topic) {
    admin
      .messaging()
      .send(this.createMessage(topic))
      .then(res => {
        console.log(res);
      });
  }
}

module.exports = SubscriptionService;
