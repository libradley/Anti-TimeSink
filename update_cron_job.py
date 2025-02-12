import sqlite3
import schedule
import time
from datetime import datetime

# Initialize the SQLite database connection
def init_db():
    conn = sqlite3.connect('blocked_websites.db')
    return conn

# Function to block a website
def block_website_task(url):
    print(f"Blocking website: {url}")

# Function to unblock a website
def unblock_website_task(url):
    print(f"Unblocking website: {url}")

# Function to update cron jobs
def update_cron_jobs():
    conn = init_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, url, start_time, end_time, selected_days, status FROM blocked_websites')
    rows = cursor.fetchall()
    conn.close()

    schedule.clear()  # Clear existing jobs

    for row in rows:
        id, url, start_time, end_time, selected_days, status = row
        days = selected_days.split(',')

        if status == 'blocked':
            for day in days:
                schedule.every().day.at(start_time).do(block_website_task, url=url)
                schedule.every().day.at(end_time).do(unblock_website_task, url=url)

# Function to check and run pending jobs
def run_pending_jobs():
    schedule.run_pending()

# Function to check if any jobs need to be removed
def check_and_remove_jobs():
    conn = init_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, url, start_time, end_time, selected_days, status FROM blocked_websites')
    rows = cursor.fetchall()
    conn.close()

    current_time = datetime.now().strftime('%H:%M')

    for row in rows:
        id, url, start_time, end_time, selected_days, status = row
        if status == 'unblocked' and current_time >= end_time:
            # Remove the job if it is unblocked and the end time has passed
            schedule.clear(url)
            print(f"Removed job for website: {url}")

# Main function to run the script
def main():
    update_cron_jobs()

    while True:
        run_pending_jobs()
        check_and_remove_jobs()
        time.sleep(300)  # Check every 5 minutes

if __name__ == '__main__':
    main()