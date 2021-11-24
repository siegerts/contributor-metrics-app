#!/bin/bash

echo "DATABASE_URL=$(aws ssm get-parameter --name '/contributor-metrics/prod/db_url' --with-decryption | jq '.Parameter.Value')" >> .env