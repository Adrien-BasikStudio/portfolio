#!/bin/bash
cd "$(dirname "$0")"
git add .
git commit -m "Update site content"
git push
echo "✅ Site mis à jour !"
