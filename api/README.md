# Fevermap back-end (API)

The back-end server is a simple Python Flask app with MariaDB database for
storage. The back-end exposes an API at `https://fevermap.net/api/` which the
front-end communicates with JSON calls.

## Development with Docker

To participate in the back-end development, you need Python skills and basic
understanding of HTTP and JSON.

To spin up a local development environment, simply run `docker-compose up
--build`. The window will keep displaying the logs from the environments.

To abort, press Ctrl+C. If you want to clear away the whole database volume
before a fresh start, run `docker-compose down --remove-orphans --volumes`.

When the development server is running, you can browse it at
http://localhost:9000 or more importantly, run `curl` or other requests against
the API.

To access the MariaDB shell, simply run
`docker exec -it fevermap_database_1 mariadb -prootpass fevermap`.

If you during testing want to empty either of the database tables, then run
`TRUNCATE submissions;`. To completely wipe out existing database, run the above
cycle to remove Docker volumes and restart everything.

## Development with Podman

In case you use [podman](https://podman.io/getting-started/) instead of docker,
here are the steps to get similar environment running with podman as an admin
user (sudo/root needed only for the time to install the tools):

```
sudo dnf install -y podman buildah
buildah bud -t fevermap/api Dockerfile.openshift
mkdir database
podman pod create -n fevermap -p 9000:9000
podman run --pod fevermap -d \
  --name fevermap_db \
  -e "MYSQL_ROOT_PASSWORD=rootpass" \
  -e "MYSQL_DATABASE=fevermap" \
  -e "MYSQL_USER=fevermap" \
  -e "MYSQL_PASSWORD=feverpass" \
  -v "database:/var/lib/mysql:z" \
  ypcs/mariadb:latest
podman run --pod fevermap -d \
  --name fevermap_api \
  -v ".:/app:z" \
  -e "FEVERMAP_API_DATABASE_URI=mysql://fevermap:feverpass@127.0.0.1/fevermap?charset=utf8mb4" \
  fevermap/api:latest
```

At the time (2020-03-22) the Debian based api container won't get built on
RHEL/CentOS likely due kernel vs. userland mismatch. The build will fail with
addgroup lock problem. I verified this works on Fedora 31 and 32 beta. The
Dockerfile.openshift is fixed to work both older and newer kernels.

For the rest of the guides, you can pretty much just replace docker command
with podman.

If you further want to take this to kubernetes, you get the kube yaml file
by the following command:

```
podman generate kube fevermap > fevermap.yml
```

## Production

1. Install and start a MariaDB server, with a custom user for the app and a
   database called 'fevermap'.

2. Install and configure a Nginx instance that handles HTTPS encryption,
   connection pooling, caching etc for backend on port 9000.

3. Start this API server by building a Docker container out of the sources and running it with:

        docker build -t fevermap/api .
        docker run -d --name fevermap_api --restart always -v "${PWD}:/app" -e FEVERMAP_API_DATABASE_URI="mysql://<user>:<password>@<database ip>/fevermap?charset=utf8mb4" -e ENV=production --expose 9000 fevermap/api

The `docker` commands can be invoked by a regular user (e.g via CI system).
Setting up MariaDB and Nginx requires root.

See status with `docker logs --follow fevermap_api` and stop with `docker rm
fevermap_api`. Modify at run time via `docker exec -it --user root fevermap_api
bash`

## API endpoints and sample requests

Example request as JSON object:
```
curl -iLsS \
  -X POST \
  -H "Content-Type: application/json" -d '
  {
    "device_id":"1584694478571",
    "fever_status":true,
    "fever_temp":"38.0",
    "birth_year":"1996",
    "gender":"M",
    "location_country_code":"FI",
    "location_postal_code":"20100",
    "location_lng":"22.28",
    "location_lat":"60.45"
  } ' \
  http://localhost:9000/api/v0/submit
```


Example request as plain form data:
```
$ curl -iLsS \
    -X POST \
    --data device_id=1584605243123 \
    --data fever_status=true \
    --data fever_temp=37.1 \
    --data birth_year=1983 \
    --data gender=M \
    --data location_country_code=FI \
    --data location_postal_code=33100 \
    --data location_lng=61.49 \
    --data location_lat=23.76 \
    http://localhost:9000/api/v0/submit
```

Example responses:
```
{
    "success": true,
    "message": "Submission received.",
    "data": {
        "device_id": 1584605243333,
        "fever_status": true,
        "fever_temp": 37.0,
        "birth_year": 1983,
        "location_country_code": "FI",
        "location_postal_code": "33100",
        "location_lng": 61.49,
        "location_lat": 23.76,
        "history": [
            [
                "2020-03-19T23:36:03",
                true,
                37.0
            ]
        ]
    }
}
```

```
{
    "success": false,
    "message": "Do not submit new temp before 2020-03-20T11:36:03",
    "data": {
        "history": [
            [
                "2020-03-19T23:36:03",
                true,
                37.0
            ]
        ]
    }
}
```

```
{
    "success": false,
    "message": "Invalid payload rejected.",
    "data": [
        "gender",
        "Value not M or F"
    ]
}
```

## Data model

Defined via Python SQLAlchemy that translate into MariaDB tables;
```
MariaDB [fevermap]> describe submitters;
+--------------------+---------------+------+-----+---------+----------------+
| Field              | Type          | Null | Key | Default | Extra          |
+--------------------+---------------+------+-----+---------+----------------+
| id                 | int(11)       | NO   | PRI | NULL    | auto_increment |
| timestamp_created  | datetime      | NO   |     | NULL    |                |
| timestamp_modified | datetime      | NO   |     | NULL    |                |
| device_id          | bigint(20)    | YES  | UNI | NULL    |                |
| birth_year         | smallint(6)   | YES  |     | NULL    |                |
| gender             | enum('M','F') | YES  |     | NULL    |                |
+--------------------+---------------+------+-----+---------+----------------+

MariaDB [fevermap]> select * from submitters;
+----+---------------------+---------------------+---------------+------------+--------+
| id | timestamp_created   | timestamp_modified  | device_id     | birth_year | gender |
+----+---------------------+---------------------+---------------+------------+--------+
|  1 | 2020-03-19 23:36:03 | 2020-03-19 23:36:03 | 1584605243333 |       1983 | M      |
+----+---------------------+---------------------+---------------+------------+--------+

MariaDB [fevermap]> describe submissions;
+-----------------------------+-------------+------+-----+---------+----------------+
| Field                       | Type        | Null | Key | Default | Extra          |
+-----------------------------+-------------+------+-----+---------+----------------+
| id                          | int(11)     | NO   | PRI | NULL    | auto_increment |
| timestamp_created           | datetime    | NO   |     | NULL    |                |
| timestamp_modified          | datetime    | NO   |     | NULL    |                |
| fever_status                | tinyint(1)  | YES  |     | NULL    |                |
| fever_temp                  | float       | YES  |     | NULL    |                |
| symptom_difficult_to_breath | tinyint(1)  | YES  |     | NULL    |                |
| symptom_cough               | tinyint(1)  | YES  |     | NULL    |                |
| symptom_sore_throat         | tinyint(1)  | YES  |     | NULL    |                |
| symptom_muscle_pain         | tinyint(1)  | YES  |     | NULL    |                |
| diagnosed_covid19           | tinyint(1)  | YES  |     | NULL    |                |
| location_country_code       | varchar(2)  | YES  |     | NULL    |                |
| location_postal_code        | varchar(10) | YES  |     | NULL    |                |
| location_lng                | int(11)     | YES  |     | NULL    |                |
| location_lat                | int(11)     | YES  |     | NULL    |                |
| submitter_id                | int(11)     | YES  | MUL | NULL    |                |
+-----------------------------+-------------+------+-----+---------+----------------+

MariaDB [fevermap]> select * from submissions;
+---------+---------------------+---------------------+--------------+------------+-----------------------------+---------------+---------------------+---------------------+-------------------+-----------------------+----------------------+--------------+--------------+--------------+
| id      | timestamp_created   | timestamp_modified  | fever_status | fever_temp | symptom_difficult_to_breath | symptom_cough | symptom_sore_throat | symptom_muscle_pain | diagnosed_covid19 | location_country_code | location_postal_code | location_lng | location_lat | submitter_id |
+---------+---------------------+---------------------+--------------+------------+-----------------------------+---------------+---------------------+---------------------+-------------------+-----------------------+----------------------+--------------+--------------+--------------+
| 3937597 | 2020-04-13 07:18:45 | 2020-04-13 07:18:45 |            0 |       NULL |                        NULL |          NULL |                NULL |                NULL |                 0 | US                    | 70-17710             |           22 |           60 |       187580 |
+---------+---------------------+---------------------+--------------+------------+-----------------------------+---------------+---------------------+---------------------+-------------------+-----------------------+----------------------+--------------+--------------+--------------+

MariaDB [fevermap]> SELECT submissions.timestamp_created,fever_status,fever_temp,diagnosed_covid19,location_country_code,location_postal_code,location_lng,location_lat,submitter_id,device_id,birth_year,gender FROM submissions LEFT JOIN submitters ON submissions.submitter_id=submitters.id;
+---------------------+--------------+------------+-------------------+-----------------------+----------------------+--------------+--------------+--------------+---------------+------------+--------+
| timestamp_created   | fever_status | fever_temp | diagnosed_covid19 | location_country_code | location_postal_code | location_lng | location_lat | submitter_id | device_id     | birth_year | gender |
+---------------------+--------------+------------+-------------------+-----------------------+----------------------+--------------+--------------+--------------+---------------+------------+--------+
| 2020-04-16 16:12:14 |            0 |       NULL |                 0 | FI                    | 20100                |           22 |           60 |            1 | 1584694478111 |       2000 | F      |
| 2020-04-16 16:12:14 |            0 |       NULL |                 0 | SE                    | 7017710              |           22 |           60 |            2 | 1584694478222 |       2000 | F      |
| 2020-04-16 16:12:15 |            1 |         38 |                 1 | FI                    | 20100                |           22 |           60 |            3 | 1584694478333 |       2000 | M      |
| 2020-04-16 16:12:15 |            0 |       NULL |                 0 | US                    | 70-17710             |           22 |           60 |            4 | 1584694478444 |       2000 | M      |
| 2020-04-16 16:12:15 |            0 |         37 |                 1 | IE                    | H91 E2K3             |           -9 |           53 |            5 | 1584694478555 |       1980 | M      |
| 2020-04-16 16:12:15 |            0 |       37.3 |                 0 | FI                    | 33100                |           24 |           61 |            6 | 1584694478666 |       1980 | M      |
| 2020-04-16 16:12:15 |            0 |       NULL |                 0 | US                    | 70-17710             |           22 |           60 |            7 | 1587053535437 |       2000 | M      |
| 2020-04-19 11:08:33 |            0 |       NULL |                 0 | FI                    | 20100                |           22 |           60 |            1 | 1584694478111 |       2000 | F      |
| 2020-04-19 11:08:33 |            0 |       NULL |                 0 | SE                    | 7017710              |           22 |           60 |            2 | 1584694478222 |       2000 | F      |
| 2020-04-19 11:08:33 |            1 |         38 |                 1 | FI                    | 20100                |           22 |           60 |            3 | 1584694478333 |       2000 | M      |
| 2020-04-19 11:08:33 |            0 |       NULL |                 0 | US                    | 70-17710             |           22 |           60 |            4 | 1584694478444 |       2000 | M      |
| 2020-04-19 11:08:33 |            0 |         37 |                 1 | IE                    | H91 E2K3             |           -9 |           53 |            5 | 1584694478555 |       1980 | M      |
| 2020-04-19 11:08:33 |            0 |       37.3 |                 0 | FI                    | 33100                |           24 |           61 |            6 | 1584694478666 |       1980 | M      |
| 2020-04-19 11:08:33 |            0 |       NULL |                 0 | US                    | 70-17710             |           22 |           60 |            8 | 1587294513836 |       2000 | M      |
| 2020-04-19 11:08:40 |            0 |       NULL |                 0 | US                    | 70-17710             |           22 |           60 |            9 | 1587294520558 |       2000 | M      |
+---------------------+--------------+------------+-------------------+-----------------------+----------------------+--------------+--------------+--------------+---------------+------------+--------+
