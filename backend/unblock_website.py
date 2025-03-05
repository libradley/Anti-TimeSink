import subprocess
import sys


def remove_url(url):
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


if __name__ == "__main__":
    url = sys.argv[1]
    remove_url(url)
