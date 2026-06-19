#!/usr/bin/env bash

ssh sso-poc 'mkdir -p /root/.certs'
scp -r ./.certs/. sso-poc:/root/.certs/
echo "Files in /root/.certs on vm:"
ssh sso-poc 'ls /root/.certs'
