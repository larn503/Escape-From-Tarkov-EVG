"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Save = void 0;
const config_json_1 = __importDefault(require("../config/config.json"));
class Save {
    constructor(container, logger) {
        this.container = container;
        this.logger = logger;
        this.location = "undefined";
    }
    load() {
        this.logger.debug("Loading Save Patching...");
        const staticRouterModService = this.container.resolve("StaticRouterModService");
        staticRouterModService.registerStaticRouter("Lua-ScavMapKeyAccessPatcher-/client/match/offline/end", [
            {
                url: "/client/match/offline/end",
                action: (url, info, sessionID, output) => {
                    const saveServer = this.container.resolve("SaveServer");
                    const profile = saveServer.getProfile(sessionID);
                    this.location = profile.inraid.location;
                    return output;
                }
            }
        ], "aki");
        staticRouterModService.registerStaticRouter("Lua-ScavMapKeyAccessPatcher-/raid/profile/save", [
            {
                url: "/raid/profile/save",
                action: (url, info, sessionID, output) => {
                    this.PatchSave(info, sessionID);
                    return output;
                }
            }
        ], "aki");
        this.logger.debug("Completed Save Patching...");
    }
    PatchSave(offraidData, sessionID) {
        if (!this.location) {
            return;
        }
        const saveServer = this.container.resolve("SaveServer");
        const profile = saveServer.getProfile(sessionID);
        const pmcData = profile.characters.pmc;
        //const profileFile = this.container.resolve<JsonUtil>("JsonUtil").deserialize( this.container.resolve<VFS>("VFS").readFile(`user/profiles/${sessionID}.json`) ); // Cover your eyes
        //const mapKey = this.container.resolve<DatabaseServer>("DatabaseServer").getTables()?.locations[locationName]?.base?.AccessKeys[0] || "none";
        this.logger.debug("Player is scav?: " + offraidData.isPlayerScav);
        this.logger.debug("Current map from config: " + this.location);
        const mapKey = config_json_1.default[this.location].AccessKey;
        if (!offraidData.isPlayerScav) {
            this.logger.debug("Not an scav raid, skipping...");
            return;
        }
        if (!mapKey || mapKey === "none") {
            this.logger.debug("No raid location info found from the server, no access key were removed...");
            return;
        }
        if (!config_json_1.default[this.location]?.RemoveAccessKeyAfterRaid) {
            this.logger.debug(`"${this.location}" has access key with no removeal config, skipping...`);
            return;
        }
        for (const i in pmcData.Inventory.items) {
            const item = pmcData.Inventory.items[i];
            if (item._tpl === mapKey && item.slotId != "hideout") {
                this.logger.debug(`Access key item found: "${item._id}" on pmc inventory, removed...`);
                if (item?.upd?.StackObjectsCount > 1) {
                    this.logger.debug(`Stacked item, Reduce stack instead of removeal...`);
                    item.upd.StackObjectsCount--;
                }
                else {
                    pmcData.Inventory.items.splice(i, 1);
                    for (let j = 0; j < pmcData.Inventory.items.length; j++) {
                        const childitem = pmcData.Inventory.items[j];
                        if (childitem.parentId === item._id) {
                            this.logger.debug(`Child item found: "${childitem._id}" on access key inventory, removed...`);
                            pmcData.Inventory.items.splice(j--, 1);
                        }
                    }
                }
                break;
            }
        }
    }
}
exports.Save = Save;
