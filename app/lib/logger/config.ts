import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, json, prettyPrint } = winston.format;

const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), json(), prettyPrint()),
  transports: [
    // Daily rotating error log
    new DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      level: "error",
      zippedArchive: true, // optionally compress
      maxSize: "10m",       // optional size limit
      maxFiles: "14d",      // keep logs for 14 days
    }),
  ],
});

export default logger;