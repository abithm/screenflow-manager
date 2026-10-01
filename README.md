# ScreenFlow Manager

# Product Overview

This application is a cloud-based digital signage platform used to manage TVs and displays across multiple stores. Administrators upload media, create playlists, assign content to screens, and monitor screen status remotely.

The system supports multiple customers and is designed for retail environments.

The platform consists of:

1. Web Dashboard (CMS)

2. API Backend

3. Player Devices (Electron application)

4. Supabase Database and Storage

---

# User Roles

## Super Admin

Can:

- Manage all users

- Manage stores

- Manage screens

- Upload media

- Create playlists

- Create schedules

- View proof of play logs

- View screenshots

- View device health

## Admin

Can:

- Manage assigned stores

- Upload media

- Create playlists

- Assign screens

- View reports

## Viewer

Can:

- View dashboards

- View screen status

- View playlists

---

# Stores

Stores represent physical locations.

Fields:

- id

- name

- address

- city

- country

- timezone

One store contains many screens.

---

# Screens

A screen represents one display device.

Fields:

- id

- device_id

- screen_name

- store_id

- status

- last_seen

- current_playlist_id

- screenshot_url

Statuses:

- Online

- Offline

- Unknown

One screen belongs to one store.

One screen has one active playlist.

---

# Media Library

Supported media types:

- Video

- Image

- PDF

- Web URL

Media files are stored in Supabase Storage.

Fields:

- id

- title

- type

- file_url

- file_size

- created_at

---

# Playlists

Playlists contain ordered media items.

Fields:

- id

- name

- description

- version

One playlist contains many playlist items.

Version number increases whenever playlist changes.

---

# Playlist Items

Fields:

- id

- playlist_id

- media_id

- order_number

- display_duration

Videos play until completion.

Images and PDFs use display_duration.

---

# Scheduler

Allows assigning playlists to screens during time periods.

Fields:

- screen_id

- playlist_id

- start_time

- end_time

- active_days

Schedules override previous assignments.

---

# Campaigns

Campaigns allow grouping playlists.

Fields:

- name

- start_date

- end_date

- screen_groups

Campaigns may target multiple stores.

---

# Device Registration

Player devices automatically register themselves on first startup.

Each device generates a unique device_id.

Unassigned devices appear in the dashboard and wait for administrator assignment.

---

# Heartbeat

Player sends heartbeat every 30 seconds.

Fields:

- device_id

- timestamp

- app_version

- storage_available

- status

If no heartbeat is received for 2 minutes, screen status becomes Offline.

---

# Screenshot Monitoring

Player uploads screenshots every 5 minutes.

Fields:

- device_id

- screenshot_url

- timestamp

Dashboard displays latest screenshot preview.

---

# Proof Of Play Logs

Whenever media starts playing, a log entry is created.

Fields:

- device_id

- media_name

- start_time

- end_time

Used for reporting and auditing.

---

# Offline Behavior

Player caches files locally.

If internet is unavailable:

- Continue playback

- Do not interrupt playlists

- Synchronize when internet returns

---

# API Endpoint

GET /api/player/{device_id}

Returns:

{

  "version":1,

  "playlist":[

    {

      "type":"video",

      "url":"",

      "duration":0

    },

    {

      "type":"image",

      "url":"",

      "duration":10

    }

  ]

}

---

POST /api/heartbeat

Body:

{

 "device_id":"",

 "status":"online",

 "storage_available":"",

 "app_version":"1.0"

}

---

POST /api/screenshot

Body:

{

 "device_id":"",

 "screenshot_url":""

}

---

POST /api/proof-of-play

Body:

{

 "device_id":"",

 "media_name":"",

 "start_time":"",

 "end_time":""

}

---

# Dashboard Widgets

Display:

- Total screens

- Online screens

- Offline screens

- Active playlists

- Media count

- Last synchronization time

- Recent alerts

---

# Screen Status Rules

Green = Online

Yellow = Warning

Red = Offline

Offline condition:

No heartbeat for more than 2 minutes.

---

# Design Guidelines

Modern B2B SaaS interface.

Inspired by:

- ScreenCloud

- Xibo

- Samsung MagicINFO

- Datadog dashboards

Use:

- Tailwind

- Cards

- Tables

- Charts

- Dark mode support

Avoid luxury styling.

Focus on operational usability and scalability.

Target deployment size:

50 to 10,000 screens.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6124ced5-fb29-42c4-95c6-70f13c6dc277).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
