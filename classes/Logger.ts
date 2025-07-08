import { createLogger, format, transports } from "winston";
import path from "node:path";

const { combine, timestamp, label, printf, colorize } = format;

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
                timestamp({
                    format: "YYYY-MM-DD HH:mm:ss"
                }),
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
                        colorize({
                            all: true,
                            colors: {
                                info: 'green',
                                warn: 'yellow',
                                error: 'red',
                                debug: 'blue'
                            }
                        }),
                        timestamp({
                            format: "YYYY-MM-DD HH:mm:ss"
                        }),
                        Logger.myFormat,
                    ),
                }),
            );
        }
    }

    public info(...messages: string[]) {
        this.winstonLogger.info.apply(this.winstonLogger, this.formatLogArguments(messages));
    }

    public warn(...messages: string[]) {
        this.winstonLogger.warn.apply(this.winstonLogger, this.formatLogArguments(messages));
    }

    public error(...messages: string[]) {
        this.winstonLogger.error.apply(this.winstonLogger, this.formatLogArguments(messages));
    }

    public debug(...messages: string[]) {
        this.winstonLogger.debug.apply(this.winstonLogger, this.formatLogArguments(messages));
    }

    private getStackInfo(stackIndex) {
        var stacklist = (new Error()).stack?.split("\n").slice(3);
        var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
        var stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

        if (!stacklist || stacklist.length === 0) {
            return null;
        }

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

    private formatLogArguments(args: string[]) {
        var stackInfo = this.getStackInfo(1);
        if (stackInfo) {
            args.unshift(`[${stackInfo.file}:${stackInfo.line}:${stackInfo.pos}]`);
        } else {
            args.unshift("[Unknown location]");
        }
        return [args.join(" ")];
    }
}

export { Logger };
