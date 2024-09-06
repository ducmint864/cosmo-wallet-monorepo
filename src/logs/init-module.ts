import { AppLogger } from "./types/AppLogger";

let appLogger: AppLogger;

function initLogsModule(): void {
	AppLogger.init();
	appLogger = AppLogger.instance;
}

export {
// 	getAppLogger,
	initLogsModule,
	appLogger,
};