import { createLogger, format, transports } from "winston";
import path from "node:path";

const { combine, timestamp, label, printf } = format;

const PROJECT_ROOT = path.resolve(path.dirname(""));

class Logger {
    static myFormat = printf(({ level, message, label, timestamp }) => {
        return `[${timestamp}] [${level}] ${message}`;
    });

    private winstonLogger: any;

    constructor() {
        var date = new Date();
        var logDir = path.join(PROJECT_ROOT, "logs");
        var logFileName = `log-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.log`; 
        var errorLogFileName = `error-${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}.log`;

        this.winstonLogger = createLogger({
            level: "info",
            format: combine(
                timestamp(),
                Logger.myFormat,
            ),
            defaultMeta: { service: "user-service" },
            transports: [
                new transports.File({
                    filename: "logs/" + errorLogFileName,
                    level: "error",
                }),
                new transports.File({ filename: "logs/" + logFileName }),
            ],
        });

        if (process.env.NODE_ENV !== "production") {
            this.winstonLogger.add(
                new transports.Console({
                    format: combine(
                        timestamp(),
                        Logger.myFormat,
                    ),
                }),
            );
        }
    }

    public info(message: string) {
        this.winstonLogger.info.apply(this.winstonLogger, this.formatLogArguments(arguments));
    }

    public warn(message: string) {
        this.winstonLogger.warn.apply(this.winstonLogger, this.formatLogArguments(arguments));
    }

    public error(message: string) {
        this.winstonLogger.error.apply(this.winstonLogger, this.formatLogArguments(arguments));
    }

    public debug(message: string) {
        this.winstonLogger.debug.apply(this.winstonLogger, this.formatLogArguments(arguments));
    }

    private getStackInfo(stackIndex) {
        var stacklist = (new Error()).stack.split("\n").slice(3);
        var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
        var stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

        var s = stacklist[stackIndex] || stacklist[0];
        var sp = stackReg.exec(s) || stackReg2.exec(s);

        if (sp && sp.length === 5) {
            return {
                method: sp[1],
                relativePath: path.relative(PROJECT_ROOT, sp[2]),
                line: sp[3],
                pos: sp[4],
                file: path.basename(sp[2]),
                stack: stacklist.join("\n"),
            };
        }
    }

    private formatLogArguments(args) {
        args = Array.prototype.slice.call(args);

        var stackInfo = this.getStackInfo(1);

        if (stackInfo) {
            var calleeStr = "[" + stackInfo.file + ":" +
                stackInfo.line + "]";

            if (typeof (args[0]) === "string") {
                args[0] = calleeStr + "\t\t" + args[0];
            } else {
                args.unshift(calleeStr);
            }
        }

        return args;
    }
}

export { Logger };
