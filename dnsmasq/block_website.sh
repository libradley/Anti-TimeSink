#!/bin/bash

URL=$1
BLOCKLIST="/dnsmasq/dns.blacklist"

# Ensure the URL is not already blocked
if ! grep -q "address=/$URL/0.0.0.0" "$BLOCKLIST"; then
    echo "Blocking: $URL"
    echo "address=/$URL/0.0.0.0" >> "$BLOCKLIST"
else
    echo "$URL is already blocked."
fi

# Restart dnsmasq as sudo (but without password prompt)
sudo systemctl restart dnsmasq