"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const package_json_1 = __importDefault(require("../package.json"));
class Logger {
    constructor(container) {
        this.container = container;
        this.prefix = package_json_1.default.author + "-" + package_json_1.default.name;
    }
    get logger() {
        return this.container.resolve("WinstonLogger");
    }
    info(data) {
        this.logger.info(`${this.prefix} - ${data}`);
    }
    debug(data, onlyShowInConsole) {
        this.logger.debug(`${this.prefix} - ${data}`, onlyShowInConsole);
    }
    log(data, color, backgroundColor) {
        this.logger.log(`${this.prefix} - ${data}`, color, backgroundColor);
    }
    error(data) {
        this.logger.error(`${this.prefix} - ${data}`);
    }
    warning(data) {
        this.logger.warning(`${this.prefix} - ${data}`);
    }
    success(data) {
        this.logger.success(`${this.prefix} - ${data}`);
    }
    loading() {
        this.logger.info(`Loading: ${this.prefix} ${package_json_1.default.version}`);
    }
    complete() {
        this.logger.success(`${this.prefix} - Successfully patched`);
    }
}
exports.Logger = Logger;
