#!/usr/bin/python3

from random import seed, random, randint, getrandbits
from pprint import pprint
import time
import copy
import mysql.connector as mariadb

# Configuration begin

# IP address of the MariaDB server to send the data to
# For docker-based deployment issue the following command to find IP:
#  docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' fevermap_database_1
# (fevermap_database_1 is container id)
MARIA_DB_HOST = '172.18.0.2'

# Number of submitters (users). Each users has 10-30 submissions (determined randomly)
SUBMITTERS_QTY = 100000
# Configuration end

# Statistics of the generated dataset
stats = {"total_users": 0,
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


# Convert time from unix timestamp to the format required by MariaDB
def ts_to_mariadb(ts):
    return time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(ts))


# Insert user's submissions into the database
def submit_to_db(submissions, submitter_cursor, submissions_cursor):
    # 1st: create submitter
    submitter_query = """ INSERT INTO submitters
                       (timestamp_created, timestamp_modified, device_id, birth_year, gender) VALUES (%s,%s,%s,%s,%s)
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


# Utility function
def count_users(submissions, key):
    r = 0
    if(next((s for s in submissions if s[key]), {})):
        r = 1

    return r

# Updates stats based on a list of submissions for specific user


def update_stats(submissions):
    stats["total_users"] += 1

    for k in ["symptom_cough", "symptom_difficult_to_breath", "symptom_sore_throat", "symptom_muscle_pain"]:
        stats[k] += count_users(submissions, k)

    stats["users_w_fever"] += count_users(submissions, "fever_status")
    stats["users_w_diagnos"] += count_users(submissions, "diagnosed_covid19")
    if(next((s for s in submissions if s["gender"] == "M"), {})):
        stats["male"] += 1
    if(next((s for s in submissions if s["gender"] == "F"), {})):
        stats["female"] += 1

    for country in ["FI", "US", "SE", "IE"]:
        if(next((s for s in submissions if s["location_country_code"] == country), {})):
            stats["users_" + country] += 1

# Prints statistics of the generated data set


def print_stats(stats):
    pprint(stats)


# Returns random boolean value

def get_rand_bool():
    return bool(getrandbits(1))

# Generates the very first submission (user data)


def create_user():
    user_data = {"fever_status": None,
                 "fever_temp": None,
                 "symptom_difficult_to_breath": None,
                 "symptom_cough": None,
                 "symptom_sore_throat": None,
                 "symptom_muscle_pain": None,
                 "diagnosed_covid19": False,
                 "timestamp_created": time.time(),
                 "timestamp_modified": time.time()
                 }

    # Creating random device id more than 1584649859812
    user_data["device_id"] = randint(1584000000000, 1584000000000 * 100)

    # Randomly selecting the gender
    if(get_rand_bool()):
        user_data["gender"] = "F"
    else:
        user_data["gender"] = "M"

    # Randomly selecting birth year (12-100 years old in the year of 2020)
    user_data["birth_year"] = randint(1920, 2008)

    # Randomly selecting location between four: Finland, Ireland, USA, Sweden
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
    # Randomly selected fever status. Limitation: users will have one fever status for all submissions
    user_data["fever_status"] = get_rand_bool()

    return user_data

# Generates new submission record


def submit_record(submissions, randomizations_left):
    if(randomizations_left["submissions_left"] > 0):
        # Generating new submission based on the previous submissions
        data = copy.deepcopy(submissions[-1])
        # Generating timestamp: between 12 and 36 hours from the last one
        data["timestamp_modified"] += 3600 * randint(12, 36)
        # Cough can appear even if the temperature is normal
        if(randomizations_left["cough"] > 0):
            data["symptom_cough"] = get_rand_bool()
            randomizations_left["cough"] -= 1

        # Generating temperature
        temp = random()
        if(data["fever_status"]):
            # scaled temperature value = min + (value * (max - min))
            data["fever_temp"] = 37.0 + (temp * (40 - 37.0))
            # Randomisations fo different symptoms and COVID19 diagnosis
            for k in ["diagnosed_covid19", "symptom_muscle_pain", "symptom_sore_throat", "symptom_difficult_to_breath"]:
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


# Initializing with a constant to get the same results over different runs
seed(2)

mariadb_connection = mariadb.connect(
    user='fevermap', password='feverpass', database='fevermap', host=MARIA_DB_HOST)
cursor_submitter = mariadb_connection.cursor(prepared=True)
cursor_submissions = mariadb_connection.cursor(prepared=True)

for i in range(0, SUBMITTERS_QTY):
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
    if (i % 5000 == 0):
        mariadb_connection.commit()
        print("Submitted data from %d users" % (stats["total_users"]))

mariadb_connection.commit()
print_stats(stats)
