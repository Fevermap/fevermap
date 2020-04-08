const express = require("express");
const cors = require("cors");
const app = express();
const SubscriptionService = require("./subscription-service");

const PORT = 9001;
const VERSION = "v0";
const PREFIX = "push-api";

app.use(express.json());
app.use(cors()); // Change in prod use

// To make initialization work, a Firebase account file needs to be downloaded,
// and exported with e.g. `export GOOGLE_APPLICATION_CREDENTIALS="/home/matsu/Downloads/fevermap-firebase-account-file.json`

// Health check endpoint
app.get("/ping", (req, res) => {
  res.json({ alive: true });
});

/**
 * Used for registering a new Firebase token to notifications of certain topic
 */
app.post(`/${PREFIX}/${VERSION}/register`, (req, res) => {
  const subscriptionObject = req.body;
  if (!subscriptionObject) {
    res.json({ success: false });
  }
  const subscriptionService = SubscriptionService.getInstance();
  subscriptionService.subscribeUserToTopic(subscriptionObject, res);
});

/**
 * Used to unsubscribe users from daily notifications
 */
app.post(`/${PREFIX}/${VERSION}/unsubscribe`, (req, res) => {
  const subscriptionObject = req.body;
  if (!subscriptionObject) {
    res.json({ success: false });
  }
  const subscriptionService = SubscriptionService.getInstance();
  subscriptionService.unsubscribeFromTopic(subscriptionObject, res);
});

// Initialize service & timer
SubscriptionService.getInstance();

app.listen(PORT, () => {
  console.log(`Push service API running at port ${PORT}`);
});
