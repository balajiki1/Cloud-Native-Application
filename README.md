# WebApp - CSYE 6225

## <ins>By Rebecca Biju : 002768633</ins>
---

## About
Backend API using Node and ExpressJS to perform CRUD operations on users and products.
The Database used is PostgreSQL.
Used IntelliJ IDE for development. 
Base64 Authentication is implemented.
We publish a message to SNS Topic when an image is created or deleted. Based on this SNS, Lambda function will be triggered

#### Routes
> User Routes
- `GET v1/user/{userId}` Get User Account Information
- `PUT v1/user/{userId}` Update User's account information
- `POST v1/user` Creates a user account (unauthenticated)

> Product Routes
- `GET v1/product/{productId}` Get Product Information (unauthenticated)
- `POST v1/product` Add new product
- `PUT v1/product/{productId}` Update Product information
- `PATCH v1/product/{productId}` Update Product information
- `DELETE v1/product/{productId}` Delete Product information

> Image Routes
- `GET v1/product/{productId}/image` Get List of All Images Uploaded
- `POST v1/product/{productId}/image` Upload an image
- `GET v1/product/{productId}/image/{imageId}` Get Image Details
- `DELETE v1/product/{productId}/image/{imageId}` Delete the Image

> Health Route
- `GET /healthz` Health endpoint

### Prerequisites
- `git` (configured with ssh) [[link](https://git-scm.com/downloads)]
- `node` [[link](https://nodejs.org/en/download/)]
- `Postman` for API testing [[link](https://www.postman.com/downloads/)]
- `env` file for local Postgres step


#### How to run? (WebApp)
1. Clone the repository from Organization
    ```shell
      git clone git@github.com:CloudComputingSpringCSYE6225/webapp.git
    ```
2. Install the dependencies
   ```shell
      npm i
    ```
3. Run the program in dev mode
   ```shell
      npm run dev
    ```

#### How to test? (WebApp)
The test cases are written using Jest and Supertest. There are two test cases to test the health and invalid routes respectively.

The command to run the tests is :
   ```shell
      npm run test
   ```

#### How to build AMI using Packer
1. Go to the packer folder
   ```shell
      cd packer
    ```
2. Initialize packer
   ```shell
      packer init .
    ```
3. Validate Packer
   ```shell
      packer validate .
    ```
4. Format Packer files
   ```shell
      packer fmt
    ```
5. Build Packer
   ```shell
      packer build ec2.pkr.hcl
    ```
Note : If you want you can add a variables.auto.pkvars.hcl file if you want to provide custom variables other than the default values provided. Additionally, You can `source .venv` which exports the DB Environment variables and the packer IAM user access keys.
