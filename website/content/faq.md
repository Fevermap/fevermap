---
title: FAQ
---

## Frequently asked questions

On this page we answer the most commonly asked questions about the Fevermap.

### How do I start using the Fevermap app?

The Fevermap is implemented as a [progressive web application (PWA)](https://en.wikipedia.org/wiki/Progressive_web_application). You can open it directly at [app.fevermap.net](https://app.fevermap.net/) and install the app icon for easy access later. The app is not yet available in app stores, but we are working on it. The current PWA app works on all mobile platforms (Android, iOS, KaiOS, Tizeno, Sailfish etc) and on web browsers on any modern computer.

### Is fever a reliable symptom of the Coronavirus?

Fever is the most common symptom of COVID-19 (=SARS-CoV-2) and many other serious infections. It is also possible to have a feverless COVID-19\. However, the purpose of this app is not to diagnose COVID-19\. The app is not a medical device. The **purpose is to map the extent of the pandemia** and collect data of the outbreak expanding or slowing down, so that **authorities would better know if their measures are enough**, or if more measures are needed. For this situational awareness we do not need to know exactly who is infected by COVID-19, as tracking it with **fever as a proxy is accurate enough**.

### Is the number of confirmed COVID-19 cases or deaths a reliable number for decision making?

The [current number of COVID-19 cases in the media](https://who.maps.arcgis.com/apps/opsdashboard/index.html#/ead3c6475654481ca51c248d52ab9c61) stem from laboratory confirmed cases of COVID-19 tested positive patients. The number of deaths are based on how many deaths were attributed to COVID-19 by the coroner. [Neither number](https://www.corriere.it/politica/20_marzo_26/the-real-death-toll-for-covid-19-is-at-least-4-times-the-official-numbers-b5af0edc-6eeb-11ea-925b-a0c3cdbe1130.shtml) is anywhere near the true number of COVID-19 cases out there. [Estimates of real figures vary with an order of a magnitude](https://medium.com/@tomaspueyo/coronavirus-act-today-or-people-will-die-f4d3d9cd99ca) depending on the expert, which makes them highly inaccurate.

Both numbers are also inconvenient for authorities to base any decisions on, since they are [registered on a delay of up to two weeks after the person got infected](https://jamanetwork.com/journals/jama/fullarticle/2762130). Deaths attributed to COVID-19 are registered even later, maybe months in after the infection itself.

### Why do you focus on fever?

All serious cases of COVID-19 include fever. People who have fever are unable to work and might require medical attention, no matter of the root cause or disease. Having the number of people with fever is valuable information to authorities no matter if it was Corona, SARS, MERS, Ebola or a severe case of regular influenza. If the number of fever cases in an area go up on a population level, authorities need to react to it.

Rising body temperatures can also serve as an early warning when the outbreak is still developing. With enough data, we could even forecast the outbreaks before they happen up to 10 days before people start seeking treatment and become officially registered cases.

### What scientific studies exists to back up the approach of Fevermap?

The thermometer manufacturer Kinsa publishes data from their own devices at [healthweather.us](https://healthweather.us/?mode=Atypical). During March 2020 they were able to accurately predict which locations in the US would have most COVID-19 cased before patients started seeking medical care. The map only exists for the US and is based only on measurements from Kinsa's devices. Fevermap can do this anywhere in the world with any device.

The service [covidnearyou.org by Harvard Medical School](https://covidnearyou.org/) is doing symptom tracking somewhat similar to the Fevermap, but based on a web questionnaire and only in the US.

We are on the lookout for academic peer reviewed articles on the topic. If you are a researcher and what to use our data in your next publication, please contact us and we will help you.

### Is the app only for people with symptoms or can healthy people also participate?

Anybody can participate! We courage healthy people to track their baseline temperature with Fevermap. If you do get sick and require medical care, showing your temperature and symptoms history from the Fevermap app to a medical professional can be useful.

### Do you consider it fever at 37.5, 38.0 or 38.5 degrees Celsius?

A thermometer reading is objective in the sense that you can measure it at home, and you will get a number out of your measurement. It is not just based on a feeling or subjective call on if you think your cough is continuous or not. However, the number may vary based on many factors: is the thermometer calibrated and accurate, which part of the body was the measurement taken from, did you have stress prior to the measurement, was is in the morning or in the evening etc. Different people have different baseline temperatures and some people might have fever when their temperature goes from 36 to 37,5 degrees Celsius, while for other persons fever could set in only at 38,5 degrees.

The Fevermap application is not a medical device and we do not diagnose if you have fever or any disease. We simply collect the temperature data and based on how it on average changes for people in a certain area we are able to make estimates on the outbreak situation given enough data.

### Do you ask questions about other symptoms as well?

Yes, we also ask about cough, respiratory symptoms, sore throat and muscle pain.

For demographic information we ask for age and gender.

The additional questions help in validating the data and making analysis of it, but fever is our main metric because it is something anybody can measure at home and it is as objective as a self-reported data point can be.

There is also no authentication in the regular public version for the same reasons: we want to make the barrier to participate as low as possible.

### Why not ask more questions?

Our focus is on simplicity and a maximal volume of data points. We want to keep our participants engaged and return to the app for 10 seconds a day. Asking too many questions could decrease the number of participants, and we value quantity over quality.

This is not a self-diagnosis tool. Seek medical care if you need a diagnosis.

### Do you track users' location?

When users submit their temperature, we also store the location of that time. There is no on-going location tracking. When submitting their symptoms, users fill in their city and zip code, or opt to use the automatic location lookup that stores the users location on a similar granularity (~½–1 km accuracy).

The Fevermap is not a contact tracing solution. Fevermap helps authorities with situational awareness amid a full scale outbreak.

For tracing solutions we recommend checking out the [BlueTrace from Singapore's TraceTogether app, or](https://bluetrace.io/) [WeTrace](https://wetrace.ch/) from Switzerland, both open source software any government can adopt quickly if needed.

### How does it work? What data does it collect? Can it be trusted?

All software for both the application itself and it's back-end data storage is published as open source and open for a public audit at [gitlab.com/fevermap](https://gitlab.com/fevermap/fevermap). Submissions are well protected in our systems running on OpenShift.io, in their datacenter in Ireland. Aggregated statistical summaries of the data will be published as open data for the data research community to analyze.

### If usage of the app is anonymous, how do you prevent false/spoofed submissions?

We have limitations in place regarding how many submissions single IP addresses can send, and we develop methods to discard statistical outliers and other methods to prevent fraudulent submissions.

If a governmental collaborator so wishes, we can also make a local version of Fevermap that has authentication or other custom features to increase the value of the solution to the authority using it.

### What countries or languages is the Fevermap app available in?

Fevermap was born global and is available anywhere there is an Internet connection. Currently we have 14 languages but new translations are added all the time.

### Which authorities use the Fevermap data in their decision making process?

None yet. There are talks going on, and we hope to announce collaborations soon. Please note Fevermap was developed and launched in just about 2 weeks, which is exceptional for any kind of software project.

**Please contact us if you represent an authority that wants to benefit from Fevermap in your own administrative region.**
