import re
import sqlite3
import time
import logging
from datetime import datetime, date

# Path to the log file and database
LOG_FILE = "/var/log/dnsmasq.log"
DB_PATH = "dns_log.db"

# LOG_FILE = "./unittest/dnsmasq.log"       # path to log file for local testing

# Regular expression to parse log lines
log_pattern = re.compile(r'^(?P<timestamp>\w+\s+\d+\s+\d+:\d+:\d+)\s+dnsmasq\[(?P<process_id>\d+)\]:\s+(?P<message>.+)$')

# Configure logging
logging.basicConfig(
    filename="dns_log_watcher.log",
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logging.info("Log processor module initialized...")


def initialize_database():
    """Ensure the database and table exist."""
    print("initialize_database: dns_log, processing_state")
    with sqlite3.connect(DB_PATH) as db:
        cursor = db.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS dns_log(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME NOT NULL,
                process_id INTEGER NOT NULL,
                query_type TEXT,
                query_domain TEXT,
                query_client TEXT,
                response TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS processing_state(
                id INTEGER PRIMARY KEY,
                last_position INTEGER DEFAULT 0,
                last_timestamp DATETIME
            )
        ''')
        # Initialize state tracking row if it doesn't exist
        cursor.execute('INSERT OR IGNORE INTO processing_state (id) VALUES (1)')
        db.commit()


def get_last_position():
    """Retrieve the last read position and timestamp from the database."""
    with sqlite3.connect(DB_PATH) as db:
        cursor = db.cursor()
        cursor.execute('SELECT last_position FROM processing_state WHERE id = 1')
        last_position = cursor.fetchone()[0]
        print("get_last_position: ", last_position)
    return last_position


def update_last_position(position, last_timestamp):
    """Update the last read position and timestamp in the database."""
    with sqlite3.connect(DB_PATH) as db:
        cursor = db.cursor()
        cursor.execute(
            'UPDATE processing_state SET last_position = ?, last_timestamp = ? WHERE id = 1',
            (position, last_timestamp)
        )
        print("update_last_position: ", position, last_timestamp)
        db.commit()


def parse_then_insert(cursor, log_line):
    """Parse a log line and insert data into the database."""
    insert_query = """
        INSERT INTO dns_log (timestamp, process_id, query_type, query_domain, query_client, response)
        VALUES (?, ?, ?, ?, ?, ?)
    """
    match = log_pattern.match(log_line)

    if match:
        try:
            print("parse_then_insert: ", cursor, log_line)
            # Extract timestamp
            timestamp_str = match.group("timestamp")
            full_timestamp_str = f"{date.today().year} {timestamp_str}"
            timestamp = datetime.strptime(full_timestamp_str, "%Y %b %d %H:%M:%S")

            process_id = int(match.group("process_id"))
            message = match.group("message")

            query_type = None
            query_domain = None
            query_client = None
            response = None

            # Process different log messages
            if "query[" in message:
                msg_parts = message.split(" ")
                query_type = msg_parts[0] if len(msg_parts) > 0 else None
                query_domain = msg_parts[1] if len(msg_parts) > 1 else None
                query_client = msg_parts[-1] if len(msg_parts) > 2 else None
                # Insert data into the database
                cursor.execute(insert_query, (timestamp, process_id, query_type, query_domain, query_client, response))
            elif "config" in message:
                msg_parts = message.split(" ")
                query_type = msg_parts[0] if len(msg_parts) > 0 else None
                query_domain = msg_parts[1] if len(msg_parts) > 1 else None
                response = msg_parts[-1] if len(msg_parts) > 2 else None
                # Insert data into the database
                cursor.execute(insert_query, (timestamp, process_id, query_type, query_domain, query_client, response))
            return

        except Exception as e:
            logging.error(f"Error inserting log data: {e}")


def process_log_file():
    """Process the log file and insert new entries into the database."""
    try:
        last_position = get_last_position()
        current_position = last_position

        with sqlite3.connect(DB_PATH) as db:
            cursor = db.cursor()
            # Open the log file and seek to the last processed position
            with open(LOG_FILE, "r") as log_file:
                log_file.seek(last_position)
                for line in log_file:
                    try:
                        parse_then_insert(cursor, line)
                    except Exception as e:
                        logging.error(f"Error processing log line: {e}")
                    finally:
                        pass
                current_position = log_file.tell()  # Track current position
            db.commit()

        # Update last processed position in the database
        update_last_position(current_position, datetime.now())

    except Exception as e:
        logging.error(f"Error processing log file: {e}")


def start_processing(interval=300):
    """Start the periodic log file processing."""
    while True:
        print("Processing log file...", datetime.now())
        logging.info("Processing log file...")
        process_log_file()
        time.sleep(interval)  # Wait for the specified interval (default: 5 minutes)


if __name__ == "__main__":
    print("main_log_processor: ")
    initialize_database()
    start_processing()
