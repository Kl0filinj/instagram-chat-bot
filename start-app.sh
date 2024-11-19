#!/bin/bash

npm run start:dev &

sleep 5

ngrok http --url=pug-simple-tadpole.ngrok-free.app 4000 # CHANGE TO .env var