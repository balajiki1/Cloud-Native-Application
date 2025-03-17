#!/usr/bin/env bash

set -eo pipefail

# Update system
sudo yum update -y

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs


sudo amazon-linux-extras install epel -y
sudo yum -y install gcc openssl-devel bzip2-devel libffi-devel zlib-devel amazon-cloudwatch-agent
sudo tee /etc/yum.repos.d/pgdg.repo<<EOF
[pgdg14]
name=PostgreSQL 14 for RHEL/CentOS 7 - x86_64
baseurl=http://download.postgresql.org/pub/repos/yum/14/redhat/rhel-7-x86_64
enabled=1
gpgcheck=0
EOF
sudo yum makecache
sudo yum install postgresql14 -y



# export variables . DB_* is the name used in my webapp api

#sudo sh -c 'echo "export DB_USER='${POSTGRES_USER}'" >> /etc/profile'
#sudo sh -c 'echo "export DB_PASSWORD='${POSTGRES_PASSWORD}'" >> /etc/profile'
#sudo sh -c 'echo "export DB_DATABASE='${POSTGRES_DB}'" >> /etc/profile'
#sudo sh -c 'echo "export DB_PORT='${POSTGRES_PORT}'" >> /etc/profile'
#sudo sh -c 'echo "export DB_HOST='${POSTGRES_HOST}'" >> /etc/profile'
#
#touch /home/ec2-user/webapp/.env
#echo "DB_USER='${POSTGRES_USER}'" >> /home/ec2-user/webapp/.env
#echo "DB_PASSWORD='${POSTGRES_PASSWORD}'" >> /home/ec2-user/webapp/.env
#echo "DB_DATABASE='${POSTGRES_DB}'" >> /home/ec2-user/webapp/.env
#echo "DB_PORT='${POSTGRES_PORT}'" >> /home/ec2-user/webapp/.env
#echo "DB_HOST='${POSTGRES_HOST}'" >> /home/ec2-user/webapp/.env



cd /home/ec2-user/webapp
npm i

#Giving exec writes to owner, user and group
chmod -R 755 node_modules/
rm -rf node_modules/
npm i

sudo cp packer/webapp.service /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable webapp.service
sudo systemctl start webapp.service



# Install nginx
sudo amazon-linux-extras list | grep nginx
sudo amazon-linux-extras enable nginx1
sudo yum clean metadata
sudo yum -y install nginx
sudo systemctl enable nginx
sudo cp packer/nginx.conf /etc/nginx/
sudo systemctl restart nginx
sudo systemctl reload nginx

#Install cloudwatch
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file://home/ec2-user/webapp/packer/cloudwatch-config.json -s
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a start
