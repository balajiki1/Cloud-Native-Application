import { SNSClient } from "@aws-sdk/client-sns";
import aws from "aws-sdk"
import dotenv from "dotenv"
dotenv.config()

//Access key of dev profile
export const snsClient = new SNSClient({region: process.env.AWS_REGION, credentials: (process.env.USE_PROFILE) ? new aws.SharedIniFileCredentials({ profile: "dev" }) : null});
