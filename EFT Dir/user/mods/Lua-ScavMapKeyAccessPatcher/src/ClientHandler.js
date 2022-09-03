"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientHandler = void 0;
const offconfig_json_1 = __importDefault(require("../config/offconfig.json"));
const config_json_1 = __importDefault(require("../../evgeshka/config/config.json"));
class ClientHandler {
    constructor(container, logger) {
        this.container = container;
        this.logger = logger;
        this.raidmaplist = {};
        this.config = require("../config/config.json");
    }
    load() {
        this.logger.debug("Loading ClientHandler...");
        const databaseServer = this.container.resolve("DatabaseServer");
        const tables = databaseServer.getTables();
        if (!config_json_1.default.scavRework) {
            this.config = offconfig_json_1.default;
            for (const map of Object.keys(this.config)) {
                this.raidmaplist[map] = "-1";
            }
        }
        else {
            for (const map of Object.keys(this.config)) {
                this.raidmaplist[map] = tables.locations[map].base.EscapeTimeLimit;
            }
        }
        const staticRouterModService = this.container.resolve("StaticRouterModService");
        const httpResponseUtil = this.container.resolve("HttpResponseUtil");
        staticRouterModService.registerStaticRouter("Lua-ScavMapKeyAccessPatcher-/Lua/ScavMapAccessKeyPatcher/config/", [
            {
                url: "/Lua/ScavMapAccessKeyPatcher/config",
                action: (url, info, sessionID, output) => {
                    return httpResponseUtil.noBody(this.getMapConfig());
                }
            }
        ], "Lua-ScavMapKeyAccessPatcher");
        staticRouterModService.registerStaticRouter("Lua-ScavMapKeyAccessPatcher-/Lua/ScavMapAccessKeyPatcher/maptime/", [
            {
                url: "/Lua/ScavMapAccessKeyPatcher/maptime",
                action: (url, info, sessionID, output) => {
                    return httpResponseUtil.noBody(this.getMapTime());
                }
            }
        ], "Lua-ScavMapKeyAccessPatcher");
        this.logger.debug("Completed ClientHandler Loading...");
    }
    getMapTime() {
        this.logger.debug(`Sending maptime to client...\n${this.raidmaplist}`);
        return this.raidmaplist;
    }
    getMapConfig() {
        const databaseServer = this.container.resolve("DatabaseServer");
        const items = databaseServer.getTables().templates.items;
        const list = {};
        for (const map of Object.keys(this.config)) {
            const keyItem = this.config[map]?.AccessKey || null;
            const item = items[keyItem] || null;
            if (!keyItem) {
                continue;
            }
            if (!item) {
                this.logger.error(`Map "${map}" has bad "AccessKey" item that doesn't exist "${keyItem}", skipping item...`);
                continue;
            }
            if (item?._type != "Item") {
                this.logger.error(`Map "${map}" has bad "AccessKey" key which is not an item "${keyItem}", skipping item...`);
                continue;
            }
            list[map] = keyItem;
        }
        this.logger.debug(`Sending config to client...\n${list}`);
        return list;
    }
}
exports.ClientHandler = ClientHandler;
