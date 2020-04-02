const admin = require("firebase-admin");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

const NOTIFICATION_HOUR = 18;

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
    //    setInterval(() => this.handleDailyMessages(), 3600000);
    dayjs.extend(utc);
    setInterval(() => this.handleDailyMessages(), 3000);
    SubscriptionService._instance = this;
  }

  handleDailyMessages() {
    // Get notification time for this day
    const notificationTime = dayjs
      .utc(Date.now())
      .set("hour", NOTIFICATION_HOUR)
      .set("minute", 0)
      .set("second", 0);
    // Get current time in UTC
    let time = dayjs.utc(Date.now());
    if (time.minute() % 15 !== 0) {
      // If the current time is XX:15, XX:30, XX:45 or XX:00
      // As these are the only allowed UTC offsets
      return;
    }
    // Make sure javascript float parsing doesn't offset the number e.g. 41999 when should be 42000
    const diff = this.roundUp(notificationTime.unix() - time.unix(), 10);
    // Get difference to targeted notificationtime from now. This will act as timezone offset
    let timeZoneOffset = this.roundUp(diff / 60, 10);

    // If timezone Offset is above the maximum (Samoa timezone offset), we circle around
    if (timeZoneOffset > 840) {
      timeZoneOffset -= 1440;
    }
    const targetTimeZone = `UTC${timeZoneOffset * -1}`;
    console.log(`UTC time: ${time.format("DD-MM-YYYY : HH:mm")}`);
    console.log(
      `Sending a 18:00 notification to timezoneOffset ${targetTimeZone}`
    );
    //this.sendMessage("UTC-180");
  }

  roundUp(num, precision) {
    return Math.round(num / precision) * precision;
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
