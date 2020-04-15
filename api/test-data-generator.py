#!/usr/bin/python3
"""Test data generator for Fevermap.

This generates directly into the database dummy users and submissions for
development purposes.
"""

from random import random, randint, getrandbits
from pprint import pprint
import time
import copy
import MySQLdb as mariadb

# Number of submitters (users). Each users has 10-30 submissions (determined
# randomly)
SUBMITTERS_QTY = 10000

# Statistics of the generated dataset
stats = {"total_users": 0,
         "total_submissions": 0,
         "users_w_fever": 0,
         "users_w_diagnos": 0,
         "users_FI": 0,
         "users_IE": 0,
         "users_SE": 0,
         "users_US": 0,
         "male": 0,
         "female": 0,
         "symptom_difficult_to_breath": 0,
         "symptom_cough": 0,
         "symptom_muscle_pain": 0,
         "symptom_sore_throat": 0
         }


def ts_to_mariadb(ts):
    """Convert time from Unix timestamp to the format required by MariaDB."""
    return time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(ts))


def submit_to_db(submissions, submitter_cursor, submissions_cursor):
    """Insert user's submissions into the database."""
    # 1st: create submitter
    submitter_query = """
        INSERT INTO submitters
        (timestamp_created, timestamp_modified, device_id, birth_year, gender)
        VALUES (%s,%s,%s,%s,%s)
        """

    submitter_tuple = (ts_to_mariadb(submissions[0]["timestamp_created"]),
                       ts_to_mariadb(submissions[0]["timestamp_modified"]),
                       submissions[0]["device_id"],
                       submissions[0]["birth_year"],
                       submissions[0]["gender"])

    submitter_cursor.execute(submitter_query, submitter_tuple)
    submitter_id = submitter_cursor.lastrowid

    # 2nd. Write all submissions to the database
    submission_query = """ INSERT INTO submissions
                         ( timestamp_created,
                           timestamp_modified,
                           fever_status,
                           fever_temp,
                           location_country_code,
                           location_postal_code,
                           location_lng,
                           location_lat,
                           symptom_difficult_to_breath,
                           symptom_cough,
                           symptom_sore_throat,
                           symptom_muscle_pain,
                           diagnosed_covid19,
                           submitter_id)
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                     """

    for data in submissions:
        submission_tuple = (ts_to_mariadb(data["timestamp_created"]),
                            ts_to_mariadb(data["timestamp_modified"]),
                            data["fever_status"],
                            data["fever_temp"],
                            data["location_country_code"],
                            data["location_postal_code"],
                            data["location_lng"],
                            data["location_lat"],
                            data["symptom_difficult_to_breath"],
                            data["symptom_cough"],
                            data["symptom_sore_throat"],
                            data["symptom_muscle_pain"],
                            data["diagnosed_covid19"],
                            submitter_id)

        submissions_cursor.execute(submission_query, submission_tuple)


def count_users(submissions, key):
    """Utility function."""
    r = 0
    if(next((s for s in submissions if s[key]), {})):
        r = 1

    return r


def update_stats(submissions):
    """Update stats based on a list of submissions for specific user."""
    stats["total_users"] += 1
    stats["total_submissions"] += len(submissions)

    for k in ["symptom_cough", "symptom_difficult_to_breath",
              "symptom_sore_throat", "symptom_muscle_pain"]:
        stats[k] += count_users(submissions, k)

    stats["users_w_fever"] += count_users(submissions, "fever_status")
    stats["users_w_diagnos"] += count_users(submissions, "diagnosed_covid19")
    if(next((s for s in submissions if s["gender"] == "M"), {})):
        stats["male"] += 1
    if(next((s for s in submissions if s["gender"] == "F"), {})):
        stats["female"] += 1

    for country in ["FI", "US", "SE", "IE"]:
        if (next((s for s in submissions if s["location_country_code"] == country), {})):
            stats["users_" + country] += 1


def print_stats(stats):
    """Print statistics of the generated data set."""
    pprint(stats)


def get_rand_bool():
    """Return random boolean value."""
    return bool(getrandbits(1))


def create_user():
    """Create user and the very first submission (user data)."""
    # Make submissions start a week ago
    WEEK_IN_SECONDS = 60 * 60 * 24 * 7

    user_data = {"fever_status": None,
                 "fever_temp": None,
                 "symptom_difficult_to_breath": None,
                 "symptom_cough": None,
                 "symptom_sore_throat": None,
                 "symptom_muscle_pain": None,
                 "diagnosed_covid19": False,
                 "timestamp_created": time.time() - WEEK_IN_SECONDS,
                 "timestamp_modified": time.time() - WEEK_IN_SECONDS
                 }

    # Create random device id
    user_data["device_id"] = randint(1584000000000, 9999999999999)

    # Randomly select the gender
    if(get_rand_bool()):
        user_data["gender"] = "F"
    else:
        user_data["gender"] = "M"

    # Randomly select birth year (12-100 years old in the year of 2020)
    user_data["birth_year"] = randint(1920, 2008)

    # Randomly select location between four: Finland, Ireland, USA, Sweden
    locs = [{"location_country_code": "FI",
             "location_postal_code": "20100",
             "location_lng": "22.123",
             "location_lat": "60.123"
             },
            {"location_country_code": "IE",
             "location_postal_code": "H91 E2K3",
             "location_lng": "-9.23",
             "location_lat": "53.38"
             },
            {"location_country_code": "US",
             "location_postal_code": "70-17710",
             "location_lng": "22.11",
             "location_lat": "60.00"
             },
            {"location_country_code": "SE",
             "location_postal_code": "7017710",
             "location_lng": "22.2833007",
             "location_lat": "60.45388459999"
             }]
    user_data.update(locs[randint(0, 3)])
    # Randomly select fever status. Limitation: users will have one fever
    # status for all submissions
    user_data["fever_status"] = get_rand_bool()

    return user_data


def submit_record(submissions, randomizations_left):
    """Generate new submission record."""
    if (randomizations_left["submissions_left"] > 0):
        # Generate new submission based on the previous submissions
        data = copy.deepcopy(submissions[-1])
        # Generate timestamp: between 6 and 36 hours from the last one
        data["timestamp_modified"] += 3600 * randint(6, 36)
        # Cough can appear even if the temperature is normal
        if(randomizations_left["cough"] > 0):
            data["symptom_cough"] = get_rand_bool()
            randomizations_left["cough"] -= 1

        # Generate temperature
        temp = random()
        if(data["fever_status"]):
            # scaled temperature value = min + (value * (max - min))
            data["fever_temp"] = 37.0 + (temp * (40 - 37.0))
            # Randomisations fo different symptoms and COVID19 diagnosis
            for k in ["diagnosed_covid19", "symptom_muscle_pain",
                      "symptom_sore_throat", "symptom_difficult_to_breath"]:
                if(randomizations_left[k] > 0):
                    data[k] = get_rand_bool()
                    randomizations_left[k] -= 1
        else:
            # scaled temperature value = min + (value * (max - min))
            data["fever_temp"] = 36.3 + (temp * (37.0 - 36.3))
            data["symptom_difficult_to_breath"] = False
            data["symptom_sore_throat"] = False
            data["symptom_muscle_pain"] = False

        submissions.append(data)
        randomizations_left["submissions_left"] += -1
        return submit_record(submissions, randomizations_left)
    else:
        return submissions


# Connect to development database
mariadb_connection = mariadb.connect(
    user='fevermap', password='feverpass', database='fevermap',
    port=3306, host='fevermap_database_1')

cursor_submitter = mariadb_connection.cursor()
cursor_submissions = mariadb_connection.cursor()

for i in range(1, SUBMITTERS_QTY + 1):
    # Every user will have from 10 to 30 submissions
    randomizations = {"submissions_left": randint(10, 30),
                      "cough": 2,
                      "diagnosed_covid19": 1,
                      "symptom_sore_throat": 2,
                      "symptom_difficult_to_breath": 2,
                      "symptom_muscle_pain": 2
                      }
    submissions = submit_record([create_user()], randomizations)
    submit_to_db(submissions, cursor_submitter, cursor_submissions)
    update_stats(submissions)
    if (i > 0 and i % 500 == 0):
        mariadb_connection.commit()
        print("Submitted %d times from %d users" %
              (stats["total_submissions"], stats["total_users"]))

mariadb_connection.commit()
print_stats(stats)
