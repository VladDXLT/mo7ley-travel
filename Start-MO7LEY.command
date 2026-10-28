#!/bin/bash
# Starts MO7LEY Travel + the page editor at http://localhost:8080 and opens your browser.
cd "$(dirname "$0")"
exec python3 editor-server.py
