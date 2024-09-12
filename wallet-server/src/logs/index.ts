import { AppLogger } from "./types/AppLogger";

// singleton instance of AppLogger class
const appLogger: AppLogger = AppLogger.instance;

export {
	appLogger,
};
