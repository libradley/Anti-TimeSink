#!/bin/bash

URL=$1
BLOCKLIST="/etc/dnsmasq.d/blocked-sites.conf"

# Ensure the URL is not already blocked
if ! grep -q "address=/$URL/0.0.0.0" "$BLOCKLIST"; then
    echo "Blocking: $URL"
    echo "address=/$URL/0.0.0.0" >> "$BLOCKLIST"
else
    echo "$URL is already blocked."
fi

# Restart dnsmasq to apply changes
systemctl restart dnsmasq


# To use call this sudo ./block_website.sh facebook.com
# Cron job example 0 8 * * * root /path/to/block_website.sh facebook.com