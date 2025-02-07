import re
import sqlite3
import time
import os
import logging
from datetime import datetime, date
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Path to the log file
LOG_FILE = "./unittest/dnsmasq.log"

# Connect to sqLite db
db = sqlite3.connect('dns_log.db')
cursor = db.cursor()

# Create table if it doesn't exist
cursor.execute('''
CREATE TABLE IF NOT EXISTS dns_log(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME NOT NULL,
    process_id INTEGER NOT NULL,
    query_type TEXT,
    query_domain TEXT,
    query_client TEXT,
    response TEXT)
''')
db.commit()

# regular expression to parse the log lines from the file
log_pattern = re.compile(r'^(?P<timestamp>\w+\s+\d+\s+\d+:\d+:\d+)\s+dnsmasq\[(?P<process_id>\d+)\]:\s+(?P<message>.+)$')

# Configure logging
logging.basicConfig(
    filename="dns_log_watcher.log",     # Log file name
    level=logging.DEBUG,                # Log detailed debug info
    format="%(asctime)s - %(levelname)s - %(message)s",
)

logging.info(f"Starting log watcher script for {LOG_FILE}...")


def parse_then_insert(log_line):
    '''
    function takes in a line from the log file
        and parses it using the regex pattern
        then inserts the parsed data into the db
    '''

    match = log_pattern.match(log_line)
    if match:
        try:
            # get full date from log line
            timestamp_str = match.group('timestamp')
            full_timestamp_str = f"{date.today().year} {timestamp_str}"
            timestamp = datetime.strptime(full_timestamp_str, '%Y %b %d %H:%M:%S')

            process_id = int(match.group('process_id'))
            message = match.group('message')

            query_type = None
            query_domain = None
            query_client = None
            response = None

            if 'query[' in message:
                msg_parts = message.split(' ')
                query_type = msg_parts[0] if len(msg_parts) > 0 else None
                query_domain = msg_parts[1] if len(msg_parts) > 1 else None
                query_client = msg_parts[-1] if len(msg_parts) > 2 else None
            if 'config' in message:
                msg_parts = message.split(' ')
                query_type = msg_parts[0] if len(msg_parts) > 0 else None
                query_domain = msg_parts[1] if len(msg_parts) > 1 else None
                response = msg_parts[-1] if len(msg_parts) > 2 else None

            cursor.execute('''
                INSERT INTO dns_log (
                    timestamp,
                    process_id,
                    query_type,
                    query_domain,
                    query_client,
                    response)
                VALUES (?, ?, ?, ?, ?, ?)
                ''', (timestamp, process_id, query_type, query_domain, query_client, response))
            db.commit()
            # logging.info(f"Inserted log entry: {timestamp_str} - {process_id} - {query_type} - {query_domain} - {query_client} - {response}")

        except Exception as e:
            logging.error(f"Error inserting log data: {e}")

class LogFileHandler(FileSystemEventHandler):
    def __init__(self):
        '''
        method to initialize the file handler object
            attribute of last_processed keeps track of time
        '''
        self.last_processed = 0

    def on_modified(self, event):
        '''
        Method to called when log_file is modified,
            if time elapsed is > 60 seconds from last time,
                calls process_log_file(), and resets timer
        Returns nothing
        '''
        # logging.debug(f"File modified: {event.src_path}")
        if event.src_path == os.path.abspath(LOG_FILE):
            current_time = time.time()
            if current_time - self.last_processed > 60:
                # logging.info(f"Processing log file update...")
                self.last_processed = current_time
                process_log_file()

def process_log_file():
    '''
    Function to process the log file
        f -> opens the log file and goes line by line
        calling out the parse_then_insert f
    Returns nothing
    '''
    try:
        with open(LOG_FILE, 'r') as log_file:
            for line in log_file:
                parse_then_insert(line)
    except Exception as e:
        logging.error(f"Error processing log file: {e}")


if __name__ == '__main__':
    # Create an observer and handler
    observer = Observer()
    event_handler = LogFileHandler()
    observer.schedule(event_handler, path=os.path.abspath(LOG_FILE), recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

    cursor.close()
    db.close()