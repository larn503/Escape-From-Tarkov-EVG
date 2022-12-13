"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mod = void 0;
const Logger_1 = require("./Logger");
const Locations_1 = require("./Locations");
const Locales_1 = require("./Locales");
const Save_1 = require("./Save");
const ClientHandler_1 = require("./ClientHandler");
class Mod {
    preAkiLoad(container) {
        const logger = new Logger_1.Logger(container);
        new ClientHandler_1.ClientHandler(container, logger).load();
        new Save_1.Save(container, logger).load();
    }
    postDBLoad(container) {
        const logger = new Logger_1.Logger(container);
        logger.loading();
        new Locations_1.Locations(container, logger).load();
        new Locales_1.Locales(container, logger).load();
        logger.complete();
    }
}
exports.mod = new Mod();
