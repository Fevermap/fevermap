const admin = require("firebase-admin");
const express = require("express");
const app = express();

// To make initialization work, a Firebase account file needs to be downloaded,
// and exported with e.g. `export GOOGLE_APPLICATION_CREDENTIALS="/home/matsu/Downloads/fevermap-firebase-account-file.json`

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://fevermap-95d71.firebaseio.com"
});

const createMessage = topic => {
  return { topic };
};

const subscribeUserToTopic = subscriptionObject => {
  admin
    .messaging()
    .subscribeToTopic(
      subscriptionObject.registrationToken,
      subscriptionObject.topic
    );
};

const sendMessage = topic => {
  admin.messaging().send(createMessage("UTF-1"));
};

sendMessage();
