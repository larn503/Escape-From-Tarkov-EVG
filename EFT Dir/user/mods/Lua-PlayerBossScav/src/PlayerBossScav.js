"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PlayerBossScav_1;
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerBossScav = void 0;
const tsyringe_1 = require("C:/snapshot/project/node_modules/tsyringe");
const DatabaseServer_1 = require("C:/snapshot/project/obj/servers/DatabaseServer");
const SaveServer_1 = require("C:/snapshot/project/obj/servers/SaveServer");
const ILogger_1 = require("C:/snapshot/project/obj/models/spt/utils/ILogger");
const JsonUtil_1 = require("C:/snapshot/project/obj/utils/JsonUtil");
const PlayerScavGenerator_1 = require("C:/snapshot/project/obj/generators/PlayerScavGenerator");
const BotGenerator_1 = require("C:/snapshot/project/obj/generators/BotGenerator");
const ProfileHelper_1 = require("C:/snapshot/project/obj/helpers/ProfileHelper");
const BotHelper_1 = require("C:/snapshot/project/obj/helpers/BotHelper");
const FenceService_1 = require("C:/snapshot/project/obj/services/FenceService");
const ConfigServer_1 = require("C:/snapshot/project/obj/servers/ConfigServer");
const BotLootCacheService_1 = require("C:/snapshot/project/obj/services/BotLootCacheService");
const package_json_1 = __importDefault(require("../package.json"));
const config_json_1 = __importDefault(require("../config/config.json"));
let PlayerBossScav = PlayerBossScav_1 = class PlayerBossScav extends PlayerScavGenerator_1.PlayerScavGenerator {
    constructor(logger, databaseServer, saveServer, profileHelper, botHelper, jsonUtil, fenceService, botLootCacheService, botGenerator, configServer) {
        super(logger, databaseServer, saveServer, profileHelper, botHelper, jsonUtil, fenceService, botLootCacheService, botGenerator, configServer);
        this.logger = logger;
        this.databaseServer = databaseServer;
        this.saveServer = saveServer;
        this.profileHelper = profileHelper;
        this.botHelper = botHelper;
        this.jsonUtil = jsonUtil;
        this.fenceService = fenceService;
        this.botLootCacheService = botLootCacheService;
        this.botGenerator = botGenerator;
        this.configServer = configServer;
        this.modName = `${package_json_1.default.author}-${package_json_1.default.name}`;
    }
    // Loooooooooooooooooooooooooooooooooooooooooooooong scav v3.2.0
    generatePlayerScav(sessionID, container) {
        const profile = this.saveServer.getProfile(sessionID);
        const pmcData = profile?.characters?.pmc;
        if (!pmcData || Object.keys(pmcData).length === 0) {
            // do not generate the scave profile on the new account
            return;
        }
        PlayerBossScav_1.container = container;
        const randomUtil = container.resolve("RandomUtil");
        const hashUtil = container.resolve("HashUtil");
        const itemHelper = container.resolve("ItemHelper");
        const botTable = this.databaseServer.getTables().bots.types;
        // get karma level from profile
        const existingScavData = profile.characters.scav;
        let scavKarmaLevel = this.getScavKarmaLevel(pmcData);
        if (scavKarmaLevel >= 6)
            scavKarmaLevel = 6;
        else if (scavKarmaLevel < 0)
            scavKarmaLevel = (scavKarmaLevel) / (7 * config_json_1.default.Boss.ScavKarmaChanceMultiplierByPercent);
        let scavRole;
        let roleType;
        // Scav karma
        if (config_json_1.default?.Boss?.RoleList?.length > 0 && randomUtil.getFloat(0, 99) < config_json_1.default.Boss.BaseChance * (1.0 + (scavKarmaLevel * config_json_1.default.Boss.ScavKarmaChanceMultiplierByPercent))) {
            scavRole = config_json_1.default.Boss.RoleList[randomUtil.getInt(0, config_json_1.default.Boss.RoleList.length - 1)].toString().toLowerCase();
            roleType = "Boss";
        }
        else if (config_json_1.default?.Raider?.RoleList?.length > 0 && randomUtil.getInt(0, 99) < config_json_1.default.Raider.BaseChance * (1.0 + (scavKarmaLevel * config_json_1.default.Raider.ScavKarmaChanceMultiplierByPercent))) {
            scavRole = config_json_1.default?.Raider?.RoleList[randomUtil.getInt(0, config_json_1.default.Raider.RoleList.length - 1)].toString().toLowerCase();
            roleType = "Raider";
        }
        else {
            scavRole = config_json_1.default.Savage.RoleList[randomUtil.getInt(0, config_json_1.default.Savage.RoleList.length - 1)].toString().toLowerCase();
            roleType = "Savage";
        }
        if (scavRole === "gifter" && botTable["gifter"].inventory.Ammo === undefined) {
            botTable["gifter"].inventory.Ammo = this.jsonUtil.clone(botTable["assault"].inventory.Ammo);
        }
        scavKarmaLevel = this.getScavKarmaLevel(pmcData);
        // use karma level to get correct karmaSettings
        const playerScavKarmaSettings = this.playerScavConfig.karmaLevel[scavKarmaLevel];
        if (!playerScavKarmaSettings) {
            this.logger.error(`unable to acquire karma settings for level ${scavKarmaLevel}`);
        }
        else {
            playerScavKarmaSettings.botTypeForLoot = scavRole;
        }
        this.logger.debug(`generating player scav loadout with karma level ${scavKarmaLevel}`);
        // edit baseBotNode values
        const baseBotNode = this.constructBotBaseTemplateWithRole(scavRole, roleType);
        this.adjustBotTemplateWithKarmaSpecificSettings(playerScavKarmaSettings, baseBotNode);
        let scavData = this.botGenerator.generatePlayerScav(sessionID, playerScavKarmaSettings.botTypeForLoot.toLowerCase(), "easy", baseBotNode);
        this.botLootCacheService.clearCache();
        // add proper metadata
        scavData._id = pmcData.savage;
        scavData.aid = sessionID;
        scavData.Info.Settings = {};
        scavData.TradersInfo = this.jsonUtil.clone(pmcData.TradersInfo);
        scavData.Skills = this.getScavSkills(existingScavData);
        scavData.Stats = this.getScavStats(existingScavData);
        scavData.Info.Level = this.getScavLevel(existingScavData);
        scavData.Info.Experience = this.getScavExperience(existingScavData);
        // Secure Container (Pouch)
        if (!config_json_1.default[roleType].Pouch || config_json_1.default[roleType].Pouch.Enabled !== true) {
            scavData = this.profileHelper.removeSecureContainer(scavData);
        }
        else {
            const items = scavData.Inventory.items;
            const tables = this.databaseServer.getTables();
            let scId;
            const scavPouch = this.jsonUtil.clone(tables.templates.items["59db794186f77448bc595262"]); // Epsilon container
            scavPouch._id = "ScavPouch";
            scavPouch._props.NotShownInSlot = true;
            scavPouch._props.Grids[0]._props.cellsH = config_json_1.default[roleType].Pouch.ContainerSizeWidth;
            scavPouch._props.Grids[0]._props.cellsV = config_json_1.default[roleType].Pouch.ContainerSizeHeight;
            if (config_json_1.default[roleType].Pouch.ContainerItemFilter === false) {
                if (scavPouch._props.Grids[0]._props.filters.length === 0 || !scavPouch._props.Grids[0]._props.filters[0].Filter) {
                    scavPouch._props.Grids[0]._props.filters = [{ Filter: [], ExcludedFilter: [] }];
                }
                scavPouch._props.Grids[0]._props.filters[0].Filter = ["54009119af1c881c07000029"]; // Item base
                scavPouch._props.Grids[0]._props.filters[0].ExcludedFilter = [];
            }
            tables.templates.items[scavPouch._id] = scavPouch;
            for (const i in items) {
                if (items[i].slotId === "SecuredContainer") {
                    scId = items[i]._id;
                    items[i]._tpl = scavPouch._id;
                    break;
                }
            }
            if (scId === undefined) {
                scId = hashUtil.generate();
                items.push({ "_id": scId, "_tpl": scavPouch._id, "parentId": scavData.Inventory.equipment, "slotId": "SecuredContainer" });
            }
            const toRemove = itemHelper.findAndReturnChildrenByItems(items, scId);
            let n = items.length;
            while (n-- > 0) {
                if (scId !== items[n]._id && toRemove.includes(items[n]._id)) {
                    items.splice(n, 1);
                }
            }
        }
        // Item Durability
        if (config_json_1.default[roleType].Durability && config_json_1.default[roleType].Durability.Enabled === true) {
            const items = scavData.Inventory.items;
            if (config_json_1.default[roleType].Durability.MinPercent > config_json_1.default[roleType].Durability.MaxPercent) {
                config_json_1.default[roleType].Durability.MinPercent = config_json_1.default[roleType].Durability.MaxPercent;
            }
            for (const i in items) {
                if (!items[i].upd)
                    continue;
                // Change Equipped Weapon Only
                if (items[i].slotId != "FirstPrimaryWeapon" && items[i].slotId != "SecondPrimaryWeapon" && items[i].slotId != "SecondaryWeapon" && items[i].slotId != "Holster" && items[i].slotId != "Scabbard") {
                    if (config_json_1.default[roleType].Durability.ChangeEquippedWeaponOnly === true) {
                        continue;
                    }
                }
                else {
                    items[i].upd.Repairable.MaxDurability = config_json_1.default[roleType].Durability.MaxPercent;
                }
                if (items[i].upd.Repairable) {
                    const randomPercent = randomUtil.getInt(config_json_1.default[roleType].Durability.MinPercent, config_json_1.default[roleType].Durability.MaxPercent);
                    items[i].upd.Repairable.Durability = Math.floor((items[i].upd.Repairable.MaxDurability * randomPercent) / 100);
                }
            }
        }
        // fix low/high values
        if (typeof (config_json_1.default[roleType].Energy) !== "number") {
            this.logger.error(`${this.modName} - Energy for "${roleType}" has bad type of value (${typeof (config_json_1.default[roleType].Energy)}) instead of Number [1 ~ 10000]`);
            config_json_1.default[roleType].Energy = 100;
        }
        else if (config_json_1.default[roleType].Energy > 10000)
            config_json_1.default[roleType].Energy = 10000;
        else if (config_json_1.default[roleType].Energy < 1)
            config_json_1.default[roleType].Energy = 1;
        if (typeof (config_json_1.default[roleType].Hydration) !== "number") {
            this.logger.error(`${this.modName} - Hydration for "${roleType}" has bad type of value (${typeof (config_json_1.default[roleType].Hydration)}) instead of Number [1 ~ 10000]`);
            config_json_1.default[roleType].Hydration = 100;
        }
        if (config_json_1.default[roleType].Hydration > 10000)
            config_json_1.default[roleType].Hydration = 10000;
        else if (config_json_1.default[roleType].Hydration < 1)
            config_json_1.default[roleType].Hydration = 1;
        // edit enegery/hydration
        scavData.Health.Energy = { "Current": config_json_1.default[roleType].Energy, "Maximum": config_json_1.default[roleType].Energy };
        scavData.Health.Hydration = { "Current": config_json_1.default[roleType].Hydration, "Maximum": config_json_1.default[roleType].Hydration };
        // health scale
        for (const modBodyKey of Object.keys(config_json_1.default[roleType].HealthMultiplier)) {
            let modBodyValue = config_json_1.default[roleType].HealthMultiplier[modBodyKey];
            // skip default values
            if (modBodyValue === 1.0)
                continue;
            // fix low/high valuesmodBodyValue
            if (modBodyValue < 0.1)
                modBodyValue = 0.1;
            else if (modBodyValue > 100.0)
                modBodyValue = 100.0;
            for (const scavBodyKey of Object.keys(scavData.Health.BodyParts)) {
                if (scavBodyKey === modBodyKey) {
                    scavData.Health.BodyParts[modBodyKey].Health = {
                        "Current": scavData.Health.BodyParts[modBodyKey].Health.Current * modBodyValue,
                        "Maximum": scavData.Health.BodyParts[modBodyKey].Health.Maximum * modBodyValue
                    };
                }
            }
        }
        // edit skills
        if (Object.keys(config_json_1.default[roleType].Skills).length > 0 && Object.keys(scavData.Skills.Common).length > 0) {
            for (const key of Object.keys(config_json_1.default[roleType].Skills)) {
                let value = config_json_1.default[roleType].Skills[key];
                if (key != "BotReload") {
                    value += 150 * scavKarmaLevel * randomUtil.getFloat(0, 3);
                }
                // fix low/high values
                if (value < 0)
                    value = 0;
                else if (value > 5100)
                    value = 5100;
                let found = false;
                for (const skillIndex of Object.keys(scavData.Skills.Common)) {
                    if (scavData.Skills.Common[skillIndex].Id.toLowerCase() === key.toLowerCase()) {
                        found = true;
                        scavData.Skills.Common[skillIndex].Progress = value;
                        break;
                    }
                }
                if (found === false) {
                    scavData.Skills.Common[Object.keys(scavData.Skills.Common).length] = { "Id": key, "Progress": value, "PointsEarnedDuringSession": 0, "LastAccess": 0 };
                }
            }
        }
        // set cooldown timer
        scavData = this.setScavCooldownTimer(scavData, pmcData);
        // add scav to the profile
        this.saveServer.getProfile(sessionID).characters.scav = scavData;
        this.logger.debug(`${this.modName}\tNew ${roleType} Scav:\t"${scavRole}"`);
        return scavData;
    }
    randomRole(blacklist = [], part = "all") {
        let maxTry = 69;
        const botTable = this.databaseServer.getTables().bots.types;
        const botTypes = Object.keys(this.jsonUtil.clone(botTable)).filter(k => !blacklist.some(b => b.toLowerCase() === k.toLowerCase()));
        if (botTypes.length === 0)
            return "assault";
        const randomUtil = PlayerBossScav_1.container.resolve("RandomUtil");
        while (--maxTry > 0) {
            const randPick = botTypes[randomUtil.getInt(0, botTypes.length - 1)].toLowerCase();
            if (!randPick)
                continue;
            if (part === "all") {
                if (!botTable[randPick]?.appearance?.head.length ||
                    !botTable[randPick]?.appearance?.body.length ||
                    !botTable[randPick]?.appearance?.hands.length ||
                    !botTable[randPick]?.appearance?.feet.length ||
                    !botTable[randPick]?.appearance?.voice.length) {
                    continue;
                }
                if (!botTable[randPick]?.firstName.length && !botTable[randPick]?.lastName.length) {
                    continue;
                }
            }
            else if (part === "name") {
                if (!botTable[randPick]?.firstName.length && !botTable[randPick]?.lastName.length) {
                    continue;
                }
            }
            else {
                if (!botTable[randPick]?.appearance[part].length) {
                    continue;
                }
            }
            return randPick;
        }
        return "assault";
    }
    constructBotBaseTemplateWithRole(botTypeForLoot = "assault", roleType) {
        const baseScavType = botTypeForLoot;
        const assaultBase = this.jsonUtil.clone(this.botHelper.getBotTemplate(baseScavType));
        const appearanceConfig = config_json_1.default[roleType].RandomAppearance || undefined;
        const botTable = this.databaseServer.getTables().bots.types;
        if (appearanceConfig?.Enabled && appearanceConfig?.KeepOriginalParts) {
            const allRandom = Boolean(appearanceConfig.RandomizeEveryParts);
            let randomRole = allRandom ? undefined : this.randomRole(appearanceConfig.BlacklistRole, "all");
            for (let [part, value] of Object.entries(appearanceConfig.KeepOriginalParts)) {
                if (value === true) {
                    continue;
                }
                let randomType;
                const partLowercase = part.toLowerCase();
                if (typeof (value) === "string") {
                    const role = value.toLowerCase();
                    if (botTable[role]) {
                        if (partLowercase === "name") {
                            if (botTable[role]?.firstName.length || botTable[role]?.lastName.length) {
                                randomType = this.jsonUtil.clone(this.botHelper.getBotTemplate(role));
                            }
                        }
                        else {
                            if (botTable[role]?.appearance[partLowercase].length) {
                                randomType = this.jsonUtil.clone(this.botHelper.getBotTemplate(role));
                            }
                        }
                    }
                    else {
                        this.logger.error(`${this.modName} - KeepOriginalParts config for "${roleType}" has invalid bot type (${value}) instead of false/true/"botType"`);
                    }
                }
                if (!randomType) {
                    if (allRandom) {
                        randomRole = this.randomRole(appearanceConfig.BlacklistRole, partLowercase);
                    }
                    randomType = this.jsonUtil.clone(this.botHelper.getBotTemplate(randomRole));
                }
                this.logger.info(`\t\t\t${part}:\t${randomRole}`);
                if (partLowercase !== "name") {
                    assaultBase.appearance[partLowercase] = [...randomType.appearance[partLowercase]];
                }
                else {
                    assaultBase.firstName = [...randomType.firstName];
                    assaultBase.lastName = [...randomType.lastName];
                }
            }
        }
        // Loot bot is same as base bot, return base with no modification
        if (botTypeForLoot === baseScavType) {
            if (assaultBase.inventory.equipment.Scabbard["6087e570b998180e9f76dc24"] != null) { // fix for tagilla's hammer
                delete assaultBase.inventory.equipment.Scabbard["6087e570b998180e9f76dc24"];
            }
            return assaultBase;
        }
        const lootBase = this.jsonUtil.clone(this.botHelper.getBotTemplate(botTypeForLoot));
        assaultBase.inventory = lootBase.inventory;
        assaultBase.chances = lootBase.chances;
        assaultBase.generation = lootBase.generation;
        return assaultBase;
    }
};
PlayerBossScav = PlayerBossScav_1 = __decorate([
    (0, tsyringe_1.injectable)(),
    __param(0, (0, tsyringe_1.inject)("WinstonLogger")),
    __param(1, (0, tsyringe_1.inject)("DatabaseServer")),
    __param(2, (0, tsyringe_1.inject)("SaveServer")),
    __param(3, (0, tsyringe_1.inject)("ProfileHelper")),
    __param(4, (0, tsyringe_1.inject)("BotHelper")),
    __param(5, (0, tsyringe_1.inject)("JsonUtil")),
    __param(6, (0, tsyringe_1.inject)("FenceService")),
    __param(7, (0, tsyringe_1.inject)("BotLootCacheService")),
    __param(8, (0, tsyringe_1.inject)("BotGenerator")),
    __param(9, (0, tsyringe_1.inject)("ConfigServer")),
    __metadata("design:paramtypes", [typeof (_a = typeof ILogger_1.ILogger !== "undefined" && ILogger_1.ILogger) === "function" ? _a : Object, typeof (_b = typeof DatabaseServer_1.DatabaseServer !== "undefined" && DatabaseServer_1.DatabaseServer) === "function" ? _b : Object, typeof (_c = typeof SaveServer_1.SaveServer !== "undefined" && SaveServer_1.SaveServer) === "function" ? _c : Object, typeof (_d = typeof ProfileHelper_1.ProfileHelper !== "undefined" && ProfileHelper_1.ProfileHelper) === "function" ? _d : Object, typeof (_e = typeof BotHelper_1.BotHelper !== "undefined" && BotHelper_1.BotHelper) === "function" ? _e : Object, typeof (_f = typeof JsonUtil_1.JsonUtil !== "undefined" && JsonUtil_1.JsonUtil) === "function" ? _f : Object, typeof (_g = typeof FenceService_1.FenceService !== "undefined" && FenceService_1.FenceService) === "function" ? _g : Object, typeof (_h = typeof BotLootCacheService_1.BotLootCacheService !== "undefined" && BotLootCacheService_1.BotLootCacheService) === "function" ? _h : Object, typeof (_j = typeof BotGenerator_1.BotGenerator !== "undefined" && BotGenerator_1.BotGenerator) === "function" ? _j : Object, typeof (_k = typeof ConfigServer_1.ConfigServer !== "undefined" && ConfigServer_1.ConfigServer) === "function" ? _k : Object])
], PlayerBossScav);
exports.PlayerBossScav = PlayerBossScav;
