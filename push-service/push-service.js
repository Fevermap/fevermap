const express = require("express");
const cors = require("cors");
const app = express();
const SubscriptionService = require("./subscription-service");

const PORT = 9001;

app.use(express.json());
app.use(cors()); // Change in prod use

// To make initialization work, a Firebase account file needs to be downloaded,
// and exported with e.g. `export GOOGLE_APPLICATION_CREDENTIALS="/home/matsu/Downloads/fevermap-firebase-account-file.json`

/**
 * Used for registering a new Firebase token to notifications of certain topic
 */
app.post("/register", (req, res) => {
  const subscriptionObject = req.body;
  const subscriptionService = SubscriptionService.getInstance();
  subscriptionService.subscribeUserToTopic(subscriptionObject, res);
});

app.listen(PORT, () => {
  console.log(`Push service API running at port ${PORT}`);
});

SubscriptionService.getInstance().sendMessage("UTC-180");
