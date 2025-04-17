#!/bin/bash ./restart.sh
echo "Останавливаю все процессы Node.js..."
killall node || echo "Нет запущенных процессов Node.js."

node /Users/glebpankeev/Desktop/websec-2/src/server.js &

npm start 
