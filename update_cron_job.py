import sqlite3
import re
import os

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

    # Clear previous jobs related to website blocking
    cron.remove_all(comment="website_blocker")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    block_script = os.path.join(script_dir, "block_website.sh")
    unblock_script = os.path.join(script_dir, "unblock_website.sh")

    for row in rows:
        url, start_time, end_time, selected_days, status = row
        days = selected_days.split(",")
        cron_days = ",".join(str(day_to_cron(day)) for day in days)

        start_hour, start_minute = convert_to_24hr(start_time)
        end_hour, end_minute = convert_to_24hr(end_time)

        if status == 1:
            # Normal case: block and unblock on the same day
            cron.new(command=f"{block_script} {url}", 
                     comment="website_blocker").setall(f"{start_minute} {start_hour} * * {cron_days}")
            cron.new(command=f"{unblock_script} {url}", 
                     comment="website_blocker").setall(f"{end_minute} {end_hour} * * {cron_days}")

    # Write the cron jobs to the crontab
    cron.write()
    print("Cron jobs updated successfully.")

if __name__ == "__main__":
    update_cron_jobs()