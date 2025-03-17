packer {
  required_plugins {
    amazon = {
      version = ">= 0.0.2"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "ami_users" {
  type    = list(string)
  default = ["968826851366", "260223999168"]
}

variable "ami_instance_type" {
  type    = string
  default = "t2.micro"
}

variable "region" {
  type    = string
  default = "us-east-1"
}

variable "ami_source" {
  type    = string
  default = "ami-0dfcb1ef8550277af"
}

variable "ami_subnet_id" {
  type    = string
  default = "subnet-067ea609fa2b9a9db"
}

variable "ami_vpc_id" {
  type    = string
  default = "vpc-0054a044496a6ba4f"
}

variable "ami_name" {
  type    = string
  default = "webappAMI"
}

variable "ami_ssh_username" {
  type    = string
  default = "ec2-user"
}

variable "ami_environment" {
  type    = string
  default = "dev"
}

locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
}

source "amazon-ebs" "webapp-ami" {
  ami_name      = "${var.ami_name}-${local.timestamp}"
  ami_users     = var.ami_users
  instance_type = var.ami_instance_type
  region        = var.region
  source_ami    = var.ami_source
  ssh_username  = var.ami_ssh_username
  subnet_id     = var.ami_subnet_id
  tags = {
    Name        = "${var.ami_name}-${local.timestamp}"
    Environment = var.ami_environment
  }
  vpc_id = var.ami_vpc_id

  launch_block_device_mappings {
    device_name           = "/dev/xvda"
    delete_on_termination = true
  }
}

build {
  sources = [
    "source.amazon-ebs.webapp-ami"
  ]

  provisioner "file" {
    source      = "../webapp"
    destination = "/home/ec2-user/webapp"
  }

  provisioner "shell" {
    script = "packer/provision.sh"
  }
}
