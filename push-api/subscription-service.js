const admin = require("firebase-admin");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");

const NOTIFICATION_HOUR = 18;
const databaseURL = "https://fevermap-95d71.firebaseio.com";

class SubscriptionService {
  static getInstance() {
    return SubscriptionService._instance
      ? SubscriptionService._instance
      : new SubscriptionService();
  }

  constructor() {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: databaseURL
    });
    dayjs.extend(utc);

    // Check the time every minute. Operates the messages only 4 times an hour,
    // but since the server can be restarted, we can't rely on a looser timer.
    if (process.env.NODE_ENV === "production") {
      console.log("Started daily message timer");
      setInterval(() => this.handleDailyMessages(), 60000);
    }
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
    // Round to closest five to prevent situations like 614.1999999 from division of seconds
    let timeZoneOffset = this.roundToFive(diff / 60);

    // If timezone Offset is above the maximum (Samoa timezone offset), we circle around
    if (timeZoneOffset >= 840) {
      timeZoneOffset -= 1440; // 24 hours in minutes
    }
    const targetTimeZone = `UTC${timeZoneOffset * -1}`;
    console.log(`UTC time: ${time.format("DD-MM-YYYY : HH:mm")}`);
    console.log(
      `Sending a 18:00 notification to timezoneOffset ${targetTimeZone}`
    );
    this.sendMessage(targetTimeZone);
  }

  roundUp(num, precision) {
    return Math.round(num / precision) * precision;
  }

  roundToFive(num) {
    return Math.ceil(num / 5) * 5;
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

  /**
   * For testing purpouses.
   * Allows send to a single device
   *
   * @param userToken
   */
  sendMessageToSingleUser(userToken) {
    admin
      .messaging()
      .send({ data: { timestamp: Date.now().toString() }, token: userToken });
  }

  unsubscribeFromTopic(subscriptionObject, res) {
    console.log(
      `Unsubscribing token ${subscriptionObject.registrationToken} from topic ${subscriptionObject.topic}`
    );

    admin
      .messaging()
      .unsubscribeFromTopic(
        [subscriptionObject.registrationToken],
        subscriptionObject.topic
      )
      .then(unSubResponse => {
        console.log(unSubResponse);
        res.json({ success: true });
      })
      .catch(err => {
        res.json({ success: false, message: err });
      });
  }
}

module.exports = SubscriptionService;
