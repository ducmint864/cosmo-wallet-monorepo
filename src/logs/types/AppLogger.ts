import {
	Logger as WinstonLogger,
	createLogger,
	format,
	transports,
	addColors,
} from "winston";
// import winston from "winston";
import "winston-daily-rotate-file";
import { join } from "path";
import { AppLoggerOptions } from "./AppLoggerOptions";
import { logsConfig } from "../../config";
import { appLogger, initLogsModule } from "../init-module";

/**
 * This exports a singleton pattern
 * And the class itself is a 'facade'
 * Specific type of logger lib used: winston
 */
export class AppLogger {
	// singleton instance
	private static _instance: AppLogger;

	private _logger: WinstonLogger;

	// private singleton constructor
	private constructor() {
		const levels = logsConfig.customLevels.levels;
		const levelColors = logsConfig.customLevels.colors;
		const levelNames = Object.keys(levels);

		addColors(levelColors);

		this._logger = createLogger({
			// custom logging levels
			levels: levels,

			// highest log level (least severe)
			level: levelNames[levelNames.length - 1],

			transports: [
				new transports.Console({
					format: format.combine(
						format.colorize({
							all: true,
						}),
						format.timestamp(),
						format.printf((info) => {
							return `[${info.level.trim()}] [${new Date().toLocaleString()}] ${info.message}`;
						}),
					),
				}),
				new transports.DailyRotateFile({
					// level: "trace",
					filename: join(process.cwd(), logsConfig.storage.relativeDir, "%DATE%.combined.log"), // process.cwd() is root dir of project (which should be the parent dir of the src/ dir)
					datePattern: 'YYYY-MM-DD',
					json: false,
					format: format.combine(
						// winston.format.timestamp(),
						format.printf((info) => {
							return `[${info.level.trim()}] [${new Date().toLocaleTimeString()}] ${info.message}`;
						}),
					),
				})
			],
		});
	}

	public static init() {
		if (this._instance) {
			throw new Error("AppLogger's instance is already initialized");
		}
		this._instance = new AppLogger();
	}

	public static get instance(): AppLogger {
		if (!this._instance) {
			throw new Error("AppLogger's instance hasn't been initialized");
		}
		return this._instance;
	}

	public trace(message: string, options?: Partial<AppLoggerOptions>): void {
		(this._logger as any).trace(message);
	}
	public debug(message: string, options?: Partial<AppLoggerOptions>): void {
		(this._logger as any).debug(message);
	}

	public info(message: string, options?: Partial<AppLoggerOptions>): void {
		(this._logger as any).info(message);
	}

	public warn(message: string, options?: Partial<AppLoggerOptions>): void {
		(this._logger as any).warn(message);
	}

	public error(message: string, options?: Partial<AppLoggerOptions>): void {
		(this._logger as any).error(message);
	}

	public fatal(message: string, options?: Partial<AppLoggerOptions>): void {
		(this._logger as any).fatal(message);
	}
}
