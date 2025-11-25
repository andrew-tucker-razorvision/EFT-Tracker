#!/bin/bash
# This script runs on container start
# Since 1Password desktop integration doesn't work in containers,
# we rely on .env being generated on the host before opening the container

if [ -f ".env" ]; then
    echo "Found .env file - secrets are available"
else
    echo ""
    echo "================================================"
    echo "No .env file found!"
    echo ""
    echo "On your Windows host, run:"
    echo "  op inject -i .env.template -o .env"
    echo ""
    echo "Then rebuild the container."
    echo "================================================"
fi
