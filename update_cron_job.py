import sqlite3
import re
import os
import subprocess

from crontab import CronTab


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
        "Fri": 5, "Sat": 6, "Sun": 7
    }
    return days.get(day, "*")  # Default to '*' if invalid


def remove_dnsmasq_address(url):
    blocklist = "/etc/dnsmasq.blacklist"

    # Escape special characters in the URL
    escaped_url = url.replace("/", "\\/")

    # Read the blocklist file
    with open(blocklist, "r") as file:
        lines = file.readlines()

    # Remove the URL from the blocklist
    with open(blocklist, "w") as file:
        for line in lines:
            if f"address=/{escaped_url}/0.0.0.0" not in line:
                file.write(line)
    print(f"Unblocking: {url}")

    # Restart dnsmasq to apply changes
    subprocess.run(["sudo", "systemctl", "restart", "dnsmasq"], check=True)

def add_cronjob():
    print('adding cron job')
    rows = init_db("SELECT id, url, start_time, end_time, selected_days FROM blocked_websites ORDER BY id DESC LIMIT 1")
    cron, block_script, unblock_script, url, start_minute, start_hour, cron_days, end_minute, end_hour, key = format_db_to_cron('ADD', rows)

    cron.new(command=f"{block_script} {url}",
             comment=f"{key}").setall(f"{start_minute} {start_hour} * * {cron_days}")
    cron.new(command=f"{unblock_script} {url}",
             comment=f"{key}").setall(f"{end_minute} {end_hour} * * {cron_days}")
    cron.write()
    print("Added cron job for:", url)

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

    remove_dnsmasq_address(url)

def edit_cron_job(current_job, new_job):
            old_url = current_job[1],
            old_start_time = [2],
            old_end_time = current_job[3],
            old_day_selected = current_job[4],

            new_url = new_job['url']
            new_start_time = new_job['start_time']
            new_end_time = new_job['end_time']
            new_days_selected = new_job['selected_days']


# Function to update the crontab jobs
def format_db_to_cron(type, rows):

    if not rows:
        print("No jobs found in the database.")
        return

    # Access the user's crontab
    cron = CronTab(user=True)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    block_script = os.path.join(script_dir, "block_website.sh")
    unblock_script = os.path.join(script_dir, "unblock_website.sh")

    for row in rows:
        id, url, start_time, end_time, selected_days = row

        days = selected_days.split(",")
        cron_days = ",".join(str(day_to_cron(day)) for day in days)

        start_hour, start_minute = convert_to_24hr(start_time)
        end_hour, end_minute = convert_to_24hr(end_time)

    if type == 'ADD':
        return cron, block_script, unblock_script, url, start_minute, start_hour, cron_days, end_minute, end_hour, id
