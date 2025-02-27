import subprocess
import sys

def block_url(url):
    blocklist = "/etc/dnsmasq.blacklist"

    # Escape special characters in the URL
    escaped_url = url.replace("/", "\\/")

    # Ensure the URL is not already blocked
    with open(blocklist, "r") as file:
        lines = file.readlines()

    if any(f"address=/{escaped_url}/0.0.0.0" in line for line in lines):
        print(f"{url} is already blocked.")
        return

    # Add the URL to the blocklist
    with open(blocklist, "a") as file:
        file.write(f"address=/{escaped_url}/0.0.0.0\n")
    print(f"Blocking: {url}")

    # Restart dnsmasq to apply changes
    subprocess.run(["sudo", "systemctl", "restart", "dnsmasq"], check=True)

if __name__ == "__main__":
    url = sys.argv[1]
    block_url(url)