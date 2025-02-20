import sqlite3
import re
import os
import subprocess

from crontab import CronTab


# Initialize the SQLite database connection
def init_db():
    return sqlite3.connect("timesink.db")


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


def unblock_website(url):
    blocklist = "/home/samuelparkman/anti_timesink/dnsmasq.blacklist"

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


# Function to update the crontab jobs
def update_cron_jobs():
    conn = init_db()
    cursor = conn.cursor()
    cursor.execute("SELECT url, start_time, end_time, selected_days, status FROM blocked_websites")
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        print("No jobs found in the database.")
        return

    # Access the user's crontab
    cron = CronTab(user=True)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    block_script = os.path.join(script_dir, "block_website.sh")
    unblock_script = os.path.join(script_dir, "unblock_website.sh")

    for row in rows:
        add_cron_job = True
        delete_cron_job = None
        url, start_time, end_time, selected_days, status = row

        days = selected_days.split(",")
        cron_days = ",".join(str(day_to_cron(day)) for day in days)

        start_hour, start_minute = convert_to_24hr(start_time)
        end_hour, end_minute = convert_to_24hr(end_time)

        if cron is not None:
            for job in cron:

                # IF URL is in cron job
                if url in job.command:                 
                    job_time = f"{job.minute} {job.hour} * * {job.dow}"
                    block_time = f"{start_minute} {start_hour} * * {cron_days}"
                    unblock_time = f"{end_minute} {end_hour} * * {cron_days}"
                    if job_time in [block_time, unblock_time]:
                        # Remove cron job if status is 0 and remove it from the DNSMASQ Blacklist
                        if status == 0:
                            delete_cron_job = True
                            break
                        else:   
                            add_cron_job = False
                            break
        if add_cron_job is True:
            cron.new(command=f"{block_script} {url}",
                comment="website_blocker").setall(f"{start_minute} {start_hour} * * {cron_days}")
            cron.new(command=f"{unblock_script} {url}",
                comment="website_unblocker").setall(f"{end_minute} {end_hour} * * {cron_days}")
            cron.write()
            print("Added cron job for:", url)

        elif delete_cron_job is True:
            cron.remove(job)
            unblock_website(url)
            cron.write()
            print("Removed cron job for:", url)


if __name__ == "__main__":
    update_cron_jobs()
