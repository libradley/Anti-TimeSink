import sqlite3
import re
import os
from datetime import datetime
from crontab import CronTab
from block_website import block_url
from unblock_website import remove_url


# Initialize the SQLite database connection
def init_db(query):
    conn = sqlite3.connect("timesink.db")
    cursor = conn.cursor()
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    return rows


# Convert 12-hour AM/PM time to 24-hour format
def convert_to_24hr(time_str):
    match = re.match(r"(\d{1,2}):(\d{2})\s*(AM|PM)?", time_str, re.IGNORECASE)
    if not match:
        raise ValueError(f"Invalid time format: {time_str}")

    hour, minute, period = match.groups()
    hour, minute = int(hour), int(minute)

    if period:
        if period.upper() == "PM" and hour != 12:
            hour += 12
        elif period.upper() == "AM" and hour == 12:
            hour = 0

    return hour, minute


# Function to convert day names to cron format
def day_to_cron(day):
    days = {
        "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4,
        "Fri": 5, "Sat": 6, "Sun": 0
    }
    return days.get(day, "*")  # Default to '*' if invalid


def add_cronjob(edit=None):
    python = "/usr/bin/python3"
    if edit is None:
        rows = init_db("SELECT id, url, start_time, end_time, selected_days FROM blocked_websites ORDER BY id DESC LIMIT 1")
    else:
        rows = init_db(edit)
    cron, block_script, unblock_script, url, start_minute, start_hour, cron_days, \
        end_minute, end_hour, key = format_db_to_cron('ADD', rows)

    cron.new(command=f"{python} {block_script} {url}",
             comment=f"{key}").setall(f"{start_minute} {start_hour} * * {cron_days}")
    cron.new(command=f"{python} {unblock_script} {url}",
             comment=f"{key}").setall(f"{end_minute} {end_hour} * * {cron_days}")
    cron.write()
    print("Added cron job for:", url)

    running = should_job_run(start_minute, start_hour, end_minute, end_hour, cron_days)

    if running:
        block_url(url)

def delete_cron_job(job_id, url):
    # Access the user's crontab
    cron = CronTab(user=True)

    # Find and remove the job with the specified ID in the comments
    job_found = False
    for job in cron:
        if job.comment == str(job_id):
            cron.remove(job)
            job_found = True
            print(f'Removed cron job with ID: {job_id}')

    if not job_found:
        print(f'No cron job found with ID: {job_id}')

    # Write the updated cron jobs back to the crontab
    cron.write()
    remove_url(url)


def edit_cron_job(old_job, new_job):
    delete_cron_job(old_job[0], old_job[1])

    new_url = new_job['url']
    new_start_time = new_job['start_time']
    new_end_time = new_job['end_time']
    new_selected_days = new_job['selected_days']

    new_start_hour, new_start_minute = convert_to_24hr(new_start_time)
    new_end_hour, new_end_minute = convert_to_24hr(new_end_time)

    new_job_running = should_job_run(new_start_minute, new_start_hour, new_end_minute, new_end_hour, new_selected_days, action='edit')

    add_cronjob(f"SELECT id, url, start_time, end_time, selected_days FROM blocked_websites WHERE url = '{new_url}'")

    # Check if we need to add or remove the website from dnsmasq
    if new_job_running:
        # Scenario 1: New job running
        block_url(new_url)
    else:
        # Scenario 2 : New job not running
        remove_url(new_url)

def should_job_run(new_start_minute, new_start_hour, new_end_minute, new_end_hour, selected_days, action=None):

    #Convert mon, tue to 1, 2, ...
    if action:
        days = selected_days.split(",")
        cron_days = ",".join(str(day_to_cron(day)) for day in days)
    else:
        cron_days = selected_days

    # Get the current time
    now = datetime.now()
    current_hour = now.hour
    current_minute = now.minute
    current_time = current_hour * 60 + current_minute

    # Check if the current time falls within the new start and end times
    new_start_time = new_start_hour * 60 + new_start_minute
    new_end_time = new_end_hour * 60 + new_end_minute
    new_job_running = new_start_time <= current_time <= new_end_time

    # Returns day of the week as an integer, where Monday is 0 and Sunday is 6
    current_day_index = datetime.now().weekday()
    
    # Update index to match cronjob format where sunday is 0 and saturday is 6
    current_day_index += 1

    if current_day_index == 7:
        current_day_index = 0

    if current_day_index in cron_days and new_job_running:
        print('Job needs to run')
        return True
    else:
        print('Job does not need to run')
        return False

# Function to update the crontab jobs
def format_db_to_cron(type, rows):

    if not rows:
        print("No jobs found in the database.")
        return

    # Access the user's crontab
    cron = CronTab(user=True)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    block_script = os.path.join(script_dir, "block_website.py")
    unblock_script = os.path.join(script_dir, "unblock_website.py")

    for row in rows:
        id, url, start_time, end_time, selected_days = row

        days = selected_days.split(",")
        cron_days = ",".join(str(day_to_cron(day)) for day in days)

        start_hour, start_minute = convert_to_24hr(start_time)
        end_hour, end_minute = convert_to_24hr(end_time)

    if type == 'ADD':
        return cron, block_script, unblock_script, url, start_minute, start_hour, \
            cron_days, end_minute, end_hour, id
