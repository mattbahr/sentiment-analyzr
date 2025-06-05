#!/bin/bash

echo "PORT=$BACKEND_PORT" > ./backend/.env
echo "MONGO_HOST=$MONGO_HOST" > ./backend/.env
echo "MONGO_PORT=$MONGO_PORT" > ./backend/.env