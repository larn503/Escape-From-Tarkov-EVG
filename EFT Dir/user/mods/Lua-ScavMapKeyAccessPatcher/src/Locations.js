"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Locations = void 0;
const config_json_1 = __importDefault(require("../config/config.json"));
const config_json_2 = __importDefault(require("../../evgeshka/config/config.json"));
class Locations {
    constructor(container, logger) {
        this.container = container;
        this.logger = logger;
    }
    load() {
        this.logger.debug("Loading Locations Patching...");
        if (config_json_2.default.scavRework)
            this.PatchMaps();
        this.logger.debug("Completed Locations Patching...");
    }
    PatchMaps() {
        const databaseServer = this.container.resolve("DatabaseServer");
        const locations = databaseServer.getTables().locations;
        for (const map in locations) {
            const base = locations[map].base;
            const mapConfig = config_json_1.default[map];
            /* Filtering Map */
            if (map.toLowerCase() === "base" || base.Locked === true || base?.EnabledCoop === undefined) {
                this.logger.debug(`Not an valid map "${map}", skipping...`);
                continue;
            }
            /* DisabledForScav */
            if (mapConfig?.DisabledForScav !== undefined) {
                if (base?.DisabledForScav !== mapConfig?.DisabledForScav) {
                    this.logger.debug(`Applying "${map}".DisabledForScv to "${mapConfig.DisabledForScav}"`);
                    base.DisabledForScav = mapConfig.DisabledForScav;
                }
            }
        }
    }
}
exports.Locations = Locations;
