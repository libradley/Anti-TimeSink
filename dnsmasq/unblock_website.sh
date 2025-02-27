#!/bin/bash

URL=$1
BLOCKLIST="/dnsmasq/dns.blacklist"

URL=$(echo $URL | sed 's/\//\\\//g')

# Remove the URL from the blocklist
sed -i "\|address=/$URL/0.0.0.0|d" "$BLOCKLIST"

echo "Unblocking: $URL"

# Restart dnsmasq to apply changes
sudo systemctl restart dnsmasq

# To use call this sudo ./unblock_website.sh facebook.com
# Cron job example 0 8 * * * root /path/to/unblock_website.sh facebook.com