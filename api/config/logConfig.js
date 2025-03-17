import { join } from "path/posix"
import { createLogger, format, transports } from "winston"
import appRoot from "app-root-path"
const { combine, timestamp, printf, errors, json } = format

const logFormat = printf(({ timestamp, level, message, stack, ...meta}) => {
    return `${timestamp} ${level.toUpperCase()} ${stack || JSON.stringify(message)}`
})

export const logger = createLogger({
    format: combine(timestamp({format: "YYYY-MM-DD HH:mm:ss"}), logFormat, errors({stack: true})),
    transports: [
        new transports.Console(),
        new transports.File({ filename: `${appRoot}/logs/index.log`,
            maxsize: 1000000, // 1MB file size
            maxFiles: 5, // 5 files rotation
            tailable: true // continue writing to the same file after rotation
        }),
    ], 
})
