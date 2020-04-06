SPDX-License-Identifier: GPL-3.0-only

SPDX-FileCopyrightText: 2020 HH Partners, Attorneys-at-law, Ltd (info@hhpartners.fi)

# Privacy documentation at Fevermap open source development project

This document contains privacy related considerations in relation to Fevermap [Fevermap open source development project](https://gitlab.com/fevermap/fevermap). As the open source development project does not run software in production, it therefore does not collect any production data. However, the software is created to be used, and it is already being used in production. While the open source development project does not accept any liability for others running software, pursuant to its [license terms](https://gitlab.com/fevermap/fevermap/LICENSE), we still try to make usable software, and provide useable documentation to help in using the software. This privacy documentation is one example of that. If you find this useful, you are free to use this under the [project license](https://gitlab.com/fevermap/fevermap/LICENSE).

## No Legal Advice

Nothing herein is legal advice to you. While this has been prepared by lawyers, and participated to by other lawyers, and non-lawyers, this has been prepared for the Fevermap open source development project, and not you. You, or your own lawyer hopefully can benefit out of this material, but it is fully your responsibility to decide what to do and whether this material is useful for you.

## Full anonymous production of Fevermap vs. pseudonomyous production

Fevermap has been designed with the goal of enabling full anonymous production of a Fevermap service. Essentially, for gathering information on a large number of users to enable authorities and others to understand on a high-level what is the amount of persons having fever in a particular geographical location. This can be accomplished anonymously, in case the geographical location is not too granular, considering also other background data points being collected. 

On the other hand, the data becomes pseudonymous in case the geographical location, when considered together with other background data points, is very precise. A data that does not directly attach to a person, but which can potentially be connected to a persons with public or otherwise accessible data, is most often pseudonymus. Pseudonymous data is, under European Union regulations, personal data and subject to said regulations, albeit with somewhat looser requirements when compared to data where the identities of persons are directly accessible. 

Fevermap has secondarily been designed to enable more detailed and efficient tracking, in case someone would like to run a service processing health data. The European Union General Data Protection Regulation (GDPR) enables this to an extent (see Article 9, subsection h and i), but health data is quite often also subject to variying national regulations. 

## What data does Fevermap process?

For more details on what data Fevermap handles, pease see the respective [issue, and the below discussion](https://gitlab.com/fevermap/fevermap/-/issues/20). The discussion contains, for example [an analysis on data points managed by some version of Fevermap](https://gitlab.com/fevermap/fevermap/-/issues/20#note_317563175).

## What could a privacy notice look like in an anoymous production setting?

### Privacy notice example, full anonymous approach

This is a privacy notice of service X. X is used for infection tracking. To participate, you can report your fever and other symptoms anonymously once a day on the service. If you so decide, you can add your location to the report. 

The service is built with the aim of all collected data being anonymous. This has been taken into account in the design phase of the service, and in development and production of this service. Futhermore, the collected data is analysed in an on-going fashion to ensure that the actual data, including all data-points is and remains anonymous. If you have any concerns regarding anonymity, you can contact service X at ________. We appreciate all input helping us ensure anonymity. Any changes being introduced, to the extent they affect this privacy notice, will be reflected here.

Due to the anonymous approach, X is not obligated to follow data protection regulations.

#### What code is used for the service?

X is built based on Fevermap, open source project. Please check [Fevermap Gitlab repository to inspect or view code being used to run X](https://gitlab.com/fevermap/fevermap). X has / has not deviated from the Fevermap main line, but is not necessarily running the latest version of Fevermap open source project.

#### What data is collected by the service?

The service collects the following data points provided by the user:
* Main symptom: Fever meter reading
* Whether the user feels weel or does not feel well
* Other symptoms: difficult to breathe (yes/no)
* Other symptoms: cough (yes/no)
* Other symptoms: sore throat (yes/no)
* Other symptoms: muscular pain (yes/no)
* Age: 10 year precision
* Gender: male or female or not specified
* Postal code; postal codes, when available, are meant to be grouped to a population amount of at least 1000 persons.
* Location: location data with one decimal precision, roughly 10 kilometres (or 7 miles). You are using your browser to determine, whether to give location data or not. 
    Your browser likely asks for your permission for this, check your browser's settings or documentation, if you are unsure. The precision with one decimal is about 10 kilometres depending on the latitude. See e.g. [Wikipedia article on decimal degrees](https://en.wikipedia.org/wiki/Decimal_degrees). Location data is asked alongside population, since postal codes are not generally available or functioning in a trustworthy manner everywhere. The postal codes and location data points are also explored for usage in verifying the trustworthiness of individual submissions. 

The above data precision has been determined based on analysing the amount of population in the geographical areas where this is being used, and erred on the side of caution. Background data points (age, gender) narrow down the population group in a geographical area to 5 %. Age is considered to narrow it down to 10 % and the gender data's impact is further narrowing down to 5 %. In case the size of the population group is 1000 or greater, this can be considered quite safely anonymous, since the remaining group size would be 50 or higher. However, not all age groups are equally large, so the narrowing down could be somewhat greater, but unlikely to be 5x greater or more. The symptoms data is considered to be non-identifying in nature, i.e. a third party cannot by looking at a person determine whether he or she has sometimes in the past had a fever entry of e.g. 37.9 centigrades.

In addition the service stores the following:
* a random number generated by the service to connect your submission to your next submission. 
    Your browser stores this information so that the next time you visit the site, you can also see your previous submissions, and we can connect the submissions to one joint submission. The service is investigating whether we need to delete this random number, or change it to another random number, after some days or weeks of inactivity in order to ensure anonymity on a longer time period. If that is done, this privacy notice is amended. The goal is to ensure the usability and verifiability of the data while preserving anonymity. E.g. the random number could be changed to a hash of the random number using a hashing algorithm that is one way, i.e. no one can reproduce the original random number from the hash. But the random number (possessed by the user) could be used to produce the hash.

In addition the process of submitting information to the service includes data stored in connection of the operation of the (virtual) server environment, referred to in the following as hosting data. Hosting data is not stored by the operators of this service, but another service that is run by a party independent from the provider of this service, referred to in the following as hosting provider. This separation has been done to ensure that web site server logs are not accessible to the operators of this service who have access to the database described above. This is because, hypothetically and possibly, hosting data could be used to render the data in this service pseudonymous. IP-addresses in general may be considered pseudonymous personal data, at least in some circumstances. We do not believe these circumstances exist here. However, to be on the safe side, we have introduced a separation of the hosting data from the actual database of this servce. The separation is not just a separation wihtin an organization, but a separation to two separate and independent legal parties. These legal parties are collaborating to fight the pandemic situation, but remain independent.

Hosting data includes: 
* website server logs, consisting of time stamps and ip addresses and submitter system configurations related to the data submissions at this service.

Hosting data is stored for operational security reasons, in particular to prevent denial of service attacks, and false or fraudulent entries. Hosting data is not in the possession of the operators of this service. However, we are looking at ways to use this data in an anonymous way to prove the authenticity or reliability of entries in the database. Also, an appropriate and short data retention period is being considered.

#### Where is the service hosted?

The service is hosted by Openshift.io in the Irelend.

#### Who is running this service?

The service is being operated by xxx. Contact at xxx.

#### Who is the hosting provider?

Hosting provider is XXXX, using Openshift.io.

#### Why are you missing information required under the GDPR?

The service does not handle personal data and is therefore not subject to the GDPR. However, we take privacy very seriously, and continue to monitor the service and the collected data to ensure that it remains anonymous. In case we find instances that risk being non-anonymous, we will amend the service accordingly.

#### I have questions and/or suggestions on the privacy at your service, where can I contact?

The Fevermap open source development project can be found at https://gitlab.com/fevermap/fevermap.

This particular instance of Fevermap is run by xxx, contact at xxx.

#### What data is being publicised and where?

We are publishing results from using the service at XXXX.

## But Fevermap is running in production at fevermap.net

Yes, some persons in the open source development project have set up a service using the codebase of Fevermap, the open source development project. There could be others, too. However, those are distinct persons running a service, and they have taken their own decisions in what to do and how to decide e.g. privacy related matters with respect to their decisions.

## Version history

Version 0.1: First, work-in-progress draft