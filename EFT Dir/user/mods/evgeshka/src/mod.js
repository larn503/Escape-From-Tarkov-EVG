"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ConfigTypes_1 = require("../../../../Aki_data/Server/lib/models/enums/ConfigTypes");
// The new trader config
const baseJson = __importStar(require("../db/base.json"));
const assortJson = __importStar(require("../db/assort.json"));
const dialogueJson = __importStar(require("../db/dialogue.json"));
const questassortJson = __importStar(require("../db/questassort.json"));
const textJson = __importStar(require("../db/text.json"));
const LogBackgroundColor_1 = require("../../../../Aki_data/Server/lib/models/spt/logging/LogBackgroundColor");
//import * as questsJson from "../db/quests.json";
class EvgeshkaTrader {
    constructor() {
        this.bossRandom = 0;
        this.mod = "evgeshka";
        this.config = require("../config/config.json");
    }
    preAkiLoad(container) {
        this.logger = container.resolve("WinstonLogger");
        this.logger.debug(`[${this.mod}] Loading... `);
        this.registerProfileImage(container);
        this.registerMissionsImage(container);
        this.setupTraderUpdateTime(container);
        this.logger.log(`[${this.mod}] Loaded`, LogBackgroundColor_1.LogBackgroundColor.BLUE);
    }
    postDBLoad(container) {
        this.logger.debug(`[${this.mod}] Delayed Loading... `);
        const databaseServer = container.resolve("DatabaseServer");
        const jsonUtil = container.resolve("JsonUtil");
        // Keep a reference to the tables
        const tables = databaseServer.getTables();
        // Add the new trader to the trader lists in DatabaseServer
        tables.traders[baseJson._id] = {
            assort: jsonUtil.deserialize(jsonUtil.serialize(assortJson)),
            dialogue: jsonUtil.deserialize(jsonUtil.serialize(dialogueJson)),
            base: jsonUtil.deserialize(jsonUtil.serialize(baseJson)),
            questassort: jsonUtil.deserialize(jsonUtil.serialize(questassortJson)),
        };
        const serverconfig = container.resolve("ConfigServer");
        const insConfig = serverconfig.getConfig(ConfigTypes_1.ConfigTypes.INSURANCE);
        insConfig.insuranceMultiplier["evgeshka"] = 0.3;
        // Add quests
        const questsJson = require("../db/quests.json");
        for (const subName in questsJson) {
            const evgQuest = questsJson[subName];
            tables.templates.quests[evgQuest._id] = evgQuest;
        }
        // Add Playerr Boss Health Increase
        this.createPlrBossHealthRoute(container);
        // Add items
        const itemsJson = require("../db/items.json");
        for (const subItem in itemsJson.items) {
            const evgItem = itemsJson.items[subItem];
            tables.templates.items[evgItem._id] = evgItem;
        }
        for (const subItem in itemsJson.buffs) {
            tables.globals.config.Health.Effects.Stimulator.Buffs[subItem] = itemsJson.buffs[subItem];
        }
        for (const subItem in itemsJson.handbook) {
            const evgHandbook = itemsJson.handbook[subItem];
            tables.templates.handbook.Items.push(evgHandbook);
            tables.templates.prices[evgHandbook._id] = evgHandbook.Price;
        }
        for (const subMap in itemsJson.loot) {
            const map = tables.locations[subMap];
            const itemsMap = itemsJson.loot[subMap];
            for (const subItem in itemsMap) {
                map.looseLoot.spawnpointsForced.push(itemsMap[subItem]);
            }
        }
        //item and economy fixes and tweaks 
        this.doAirsoftBuff(container);
        this.ragfairEvgeshka(container);
        this.ragfairPriceChanger(container);
        this.fenceNerf(container);
        tables.templates.items["55d7217a4bdc2d86028b456d"]._props.Slots[5]._props.filters[0].Filter.push("evg_fake_altyn");
        tables.templates.items["55d7217a4bdc2d86028b456d"]._props.Slots[2]._props.filters[0].Filter.push("evg_rhino_338");
        for (const slot in tables.templates.items["627a4e6b255f7527fb05a0f6"]._props.Slots) {
            tables.templates.items["627a4e6b255f7527fb05a0f6"]._props.Slots[slot]._props.filters[0].Filter.push("evg_bossfinder");
        }
        tables.templates.items["5857a8bc2459772bad15db29"]._props.DiscardingBlock = true;
        this.fixScavEquip(container);
        this.setNewWeaponMastering(container);
        this.removeExclusiveItemsFromPmc(container);
        this.worsePmcArmor(container);
        // Add presets
        const itempresetsJson = require("../db/globals.json");
        for (const preset in itempresetsJson.ItemPresets) {
            tables.globals.ItemPresets[preset] = itempresetsJson.ItemPresets[preset];
        }
        // Increase lab spawn rate
        const labSpawnChance = require("../db/lab_spawn.json");
        tables.locations.laboratory.base.BossLocationSpawn = labSpawnChance.BossLocationSpawn;
        if (this.config.scavRework)
            this.standingSetting(container); //standing tweaks
        // Add Boss
        this.createBoss(container);
        this.setKnightChance(container); //Increase chance of Knight boss and add info for bossfinder
        if (this.config.bossChanceIncrease)
            this.bossSpawnChances(container); //Increase chance of sektant
        // For each language, add locale for the new trader
        const locales = Object.values(tables.locales.global);
        const modLocales = jsonUtil.deserialize(jsonUtil.serialize(textJson));
        const bossFinderDesc = ["Таможня - территория стройки между выходами ЗБ-013 и блокпост ВС РФ", "Маяк - база отступников либо шале", "Берег - метеостанция", "Лес - База диких"];
        modLocales.templates.evg_bossfinder.Description += bossFinderDesc[this.bossRandom];
        for (const locale of locales) {
            locale.trading[baseJson._id] = {
                FullName: "Евгений",
                FirstName: "Евгений",
                Nickname: "Евгешка",
                Location: "Тарковская автомобильная мастерская",
                Description: "Автомеханик, продающий оружие. Родом из Москвы"
            };
            locale.preset.AKM366JATOSTYLE = {
                "Name": "JATO STYLE"
            };
            locale.preset.evg_akmsubuild_enot = {
                "Name": "Enotiha Edition"
            };
            for (const subText in modLocales.quest) {
                const questText = modLocales.quest[subText];
                locale.quest[questText._id] = questText;
            }
            for (const subText in modLocales.templates) {
                const itemText = modLocales.templates[subText];
                locale.templates[itemText._id] = itemText;
            }
            locale.templates["6241c316234b593b5676b637"].Name = "Металлические шары 6мм";
            locale.templates["6241c316234b593b5676b637"].Description = "6 миллиметровые металлические шары массой 1 грамм.";
            //this.logger.info("evg_bossfinder description on " + locale + " is " + locale.templates["evg_bossfinder"].Description);
        }
        //Misc
        this.increaseHideout(container);
        tables.globals.config.SkillMinEffectiveness = 0.33;
        tables.globals.config.SkillsSettings.SkillProgressRate = 1.3;
        tables.globals.config.SkillsSettings.Metabolism.EnergyRecoveryRate = 0.2;
        tables.globals.config.SkillsSettings.Metabolism.HydrationRecoveryRate = 0.2;
        this.scavcaseNerf(container);
        if (this.config.levelImprove)
            this.levelImprove(container);
        this.logger.debug(`[${this.mod}] Delayed Loaded`);
    }
    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
    registerProfileImage(container) {
        // Reference the mod "res" folder
        const preAkiModLoader = container.resolve("PreAkiModLoader");
        // Register route pointing to the profile picture
        const imageRouter = container.resolve("ImageRouter");
        imageRouter.addRoute("/files/trader/avatar/evg", `${preAkiModLoader.getModPath(this.mod)}/res/avatar/evg.png`);
    }
    registerMissionsImage(container) {
        // Reference the mod "res" folder
        const preAkiModLoader = container.resolve("PreAkiModLoader");
        // Register route pointing to the profile picture
        const imageRouter = container.resolve("ImageRouter");
        imageRouter.addRoute("/files/quest/evg/evgmission1", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgmission1.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgenotiha", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgenotiha.png`);
        imageRouter.addRoute("/files/quest/evg/evgadv", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgadv.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgadv1", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgadv1.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgammo", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgammo.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgboss", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgboss.png`);
        imageRouter.addRoute("/files/quest/evg/jatobrat", `${preAkiModLoader.getModPath(this.mod)}/res/quest/jatobrat.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgbuilder", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgbuilder.png`);
        imageRouter.addRoute("/files/quest/evg/evgcollector2", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgcollector2.png`);
        imageRouter.addRoute("/files/quest/evg/evgcrash", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgcrash.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgdobro", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgdobro.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgglobalmap", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgglobalmap.png`);
        imageRouter.addRoute("/files/quest/evg/evggasmask", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evggasmask.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgfakegpu", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgfakegpu.jpg`);
        imageRouter.addRoute("/files/quest/evg/evggpu", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evggpu.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgsigi", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgsigi.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgspy", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgspy.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgkevlar", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgkevlar.png`);
        imageRouter.addRoute("/files/quest/evg/evgkit", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgkit.png`);
        imageRouter.addRoute("/files/quest/evg/evgkonk", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgkonk.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgkonk2", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgkonk2.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgnogirls", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgnogirls.png`);
        imageRouter.addRoute("/files/quest/evg/evgpatrik", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgpatrik.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgpatrik2", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgpatrik2.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgpatrik3", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgpatrik3.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgverdo", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgverdo.jpg`);
        imageRouter.addRoute("/files/quest/evg/evgweaptestairsoft", `${preAkiModLoader.getModPath(this.mod)}/res/quest/evgweaptestairsoft.png`);
        imageRouter.addRoute("/files/quest/evg/jatoweaptestadar", `${preAkiModLoader.getModPath(this.mod)}/res/quest/jatoweaptestadar.png`);
        imageRouter.addRoute("/files/quest/evg/jatoweaptestak", `${preAkiModLoader.getModPath(this.mod)}/res/quest/jatoweaptestak.png`);
        imageRouter.addRoute("/files/quest/evg/jatoweaptestaksvet", `${preAkiModLoader.getModPath(this.mod)}/res/quest/jatoweaptestaksvet.png`);
        imageRouter.addRoute("/files/quest/evg/jatoweaptestks23", `${preAkiModLoader.getModPath(this.mod)}/res/quest/jatoweaptestks23.png`);
        imageRouter.addRoute("/files/quest/evg/jatoweaptestmp", `${preAkiModLoader.getModPath(this.mod)}/res/quest/jatoweaptestmp.png`);
        imageRouter.addRoute("/files/quest/evg/jatoweapteststm", `${preAkiModLoader.getModPath(this.mod)}/res/quest/jatoweapteststm.png`);
        imageRouter.addRoute("/files/quest/evg/jatoweaptestsvd", `${preAkiModLoader.getModPath(this.mod)}/res/quest/jatoweaptestsvd.png`);
    }
    setupTraderUpdateTime(container) {
        // Add refresh time in seconds when Config server allows to set configs
        const configServer = container.resolve("ConfigServer");
        const traderConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.TRADER);
        const traderRefreshConfig = { traderId: baseJson._id, seconds: 3600 };
        traderConfig.updateTime.push(traderRefreshConfig);
    }
    createBoss(container) {
        const databaseServer = container.resolve("DatabaseServer");
        const tables = databaseServer.getTables();
        const locations = tables.locations;
        const serverconfig = container.resolve("ConfigServer");
        const botConfig = serverconfig.getConfig(ConfigTypes_1.ConfigTypes.BOT);
        const bossSpawnJson = require("../db/boss_spawn.json");
        const bossJson = require("../db/boss.json");
        botConfig.bosses.push("followertest");
        botConfig.presetBatch.followerTest = 1;
        tables.bots.types.followertest = bossJson;
        for (const subMap in bossSpawnJson) {
            locations[subMap].base.BossLocationSpawn.push(bossSpawnJson[subMap]);
        }
    }
    setKnightChance(container) {
        const databaseServer = container.resolve("DatabaseServer");
        const tables = databaseServer.getTables();
        const knightSpawnLocations = ["bigmap", "lighthouse", "shoreline", "woods"];
        const randomnum = this.getRandomInt(4);
        for (const submap in knightSpawnLocations) {
            const map = tables.locations[knightSpawnLocations[submap]].base;
            for (const subspawn in map.BossLocationSpawn) {
                if (map.BossLocationSpawn[subspawn].BossName == "bossKnight") {
                    map.BossLocationSpawn[subspawn].BossChance = 3;
                    if (randomnum == Number(submap)) {
                        map.BossLocationSpawn[subspawn].BossChance = 28;
                    }
                }
            }
        }
        this.bossRandom = randomnum;
        // this.logger.log("Chance of bigmap: " + tables.locations.bigmap.base.BossLocationSpawn[0].BossChance,"yellow");
        // this.logger.log("Chance of lighthouse: " + tables.locations.lighthouse.base.BossLocationSpawn[0].BossChance,"blue");
        // this.logger.log("Chance of shoreline: " + tables.locations.shoreline.base.BossLocationSpawn[0].BossChance,"red");
        // this.logger.log("Chance of woods: " + tables.locations.woods.base.BossLocationSpawn[0].BossChance,"green");
    }
    doAirsoftBuff(container) {
        const databaseServer = container.resolve("DatabaseServer");
        const tables = databaseServer.getTables();
        const ammo = tables.templates.items["6241c316234b593b5676b637"];
        const mag = tables.templates.items["6241c2c2117ad530666a5108"];
        ammo._props.HeatFactor = 1;
        ammo._props.InitialSpeed = 150;
        ammo._props.RicochetChance = 0.3;
        ammo._props.Tracer = true;
        ammo._props.TracerColor = "yellow";
        ammo._props.BallisticCoeficient = 0.9;
        ammo._props.Damage = 3;
        ammo._props.LightBleedingDelta = 0.35;
        ammo._props.Weight = 0.001;
        mag._props.LoadUnloadModifier = -50;
        mag._props.Cartridges[0]._max_count = 120;
    }
    createPlrBossHealthRoute(container) {
        this.logger = container.resolve("WinstonLogger");
        const staticRMS = container.resolve("StaticRouterModService");
        const pHelp = container.resolve("ProfileHelper");
        staticRMS.registerStaticRouter("StaticRoutePeekingAki", [
            {
                url: "/client/items",
                action: (url, info, sessionId, output) => {
                    const db = container.resolve("DatabaseServer").getTables();
                    const defaultParts = {
                        Head: 35,
                        Chest: 85,
                        Stomach: 70,
                        LeftArm: 60,
                        RightArm: 60,
                        LeftLeg: 65,
                        RightLeg: 65
                    };
                    const pmcData = pHelp.getPmcProfile(sessionId);
                    if (pmcData.Health && pmcData.Info) {
                        if (pmcData.Quests.find(x => (x.qid == "jatolegend" && x.status == 4))) {
                            for (const bodyPart in pmcData.Health.BodyParts) {
                                if (bodyPart == "Head") {
                                    pmcData.Health.BodyParts[bodyPart].Health.Maximum = defaultParts[bodyPart] + ((pmcData.Info.Level - 35) * 3);
                                    continue;
                                }
                                if (bodyPart == "Chest") {
                                    pmcData.Health.BodyParts[bodyPart].Health.Maximum = defaultParts[bodyPart] + ((pmcData.Info.Level - 35) * 10);
                                    continue;
                                }
                                // For else parts
                                pmcData.Health.BodyParts[bodyPart].Health.Maximum = defaultParts[bodyPart] + ((pmcData.Info.Level - 35) * 6);
                            }
                            const pockets = this.setBossPockets(pmcData.Info.Level);
                            for (const item in pmcData.Inventory.items) {
                                if (pmcData.Inventory.items[item].slotId == "Pockets") {
                                    pmcData.Inventory.items[item]._tpl = pockets;
                                    break;
                                }
                            }
                            for (const skill in pmcData.Skills.Common) {
                                if (pmcData.Skills.Common[skill].Id == "BotReload") {
                                    pmcData.Skills.Common[skill].Progress = 65 * (pmcData.Info.Level - 35);
                                    break;
                                }
                            }
                        }
                    }
                    return output;
                }
            }
        ], "aki");
    }
    setBossPockets(_level) {
        if (_level >= 55) {
            return "evg_bosspockets_8";
        }
        if (_level >= 53) {
            return "evg_bosspockets_7";
        }
        if (_level >= 51) {
            return "evg_bosspockets_6";
        }
        if (_level >= 49) {
            return "evg_bosspockets_5";
        }
        if (_level >= 46) {
            return "evg_bosspockets_4";
        }
        if (_level >= 43) {
            return "evg_bosspockets_3";
        }
        if (_level >= 40) {
            return "evg_bosspockets_2";
        }
        return "evg_bosspockets_1";
    }
    setNewWeaponMastering(container) {
        const db = container.resolve("DatabaseServer").getTables();
        const weaponList = {
            SAIGA: [
                "evg_saiga23"
            ],
            RHINO: [
                "evg_rhino_338"
            ],
            AKSU: [
                "evg_akmsu"
            ]
        };
        const masteringdb = db.globals.config.Mastering;
        const masteringname = Object.keys(weaponList);
        for (const master in masteringdb) {
            if (masteringname.find(x => (masteringdb[master].Name == x))) {
                const weapontpl = weaponList[masteringdb[master].Name];
                for (const tpl in weapontpl) {
                    masteringdb[master].Templates.push(weapontpl[tpl]);
                }
            }
        }
    }
    bossSpawnChances(container) {
        const db = container.resolve("DatabaseServer").getTables();
        const chancedb = require("../db/bosschances.json");
        for (const submap in chancedb) {
            const chancedbmap = chancedb[submap];
            const map = db.locations[submap].base;
            for (const bossSpawn in chancedbmap) {
                const spawnId = map.BossLocationSpawn.findIndex(x => (x.BossName == chancedbmap[bossSpawn].BossName));
                if (spawnId >= 0) {
                    map.BossLocationSpawn[spawnId].BossChance = chancedbmap[bossSpawn].BossChance;
                }
            }
        }
    }
    removeExclusiveItemsFromPmc(container) {
        const serverconfig = container.resolve("ConfigServer");
        const botConfig = serverconfig.getConfig(ConfigTypes_1.ConfigTypes.BOT);
        const blacklistItems = ["enot_mark", "enot_afak", "enot_etg", "enot_kondor", "enot_maska", "evg_mail", "evg_mail_pack", "evg_saiga23", "evg_rhino_338", "evg_bossfinder", "evg_akmsu", "619bc61e86e01e16f839a999", "619bdd8886e01e16f839a99c", "619bddc6c9546643a67df6ee", "60b0f988c4449e4cb624c1da", "619bde3dc9546643a67df6f2", "619bde7fc9546643a67df6f4", "619bdeb986e01e16f839a99e", "5f9949d869e2777a0e779ba5", "619bdf9cc9546643a67df6f8", "619bdef8c9546643a67df6f6", "619bddffc9546643a67df6f0", "619bdfd4c9546643a67df6fa", "6087e570b998180e9f76dc24", "601948682627df266209af05"];
        for (const item in blacklistItems) {
            botConfig.pmc.dynamicLoot.blacklist.push(blacklistItems[item]);
        }
        botConfig.pmc.convertIntoPmcChance.assault.min = 0.22; // more pmc tweak
        botConfig.maxBotCap = this.config.maxBots;
    }
    ragfairEvgeshka(container) {
        const db = container.resolve("DatabaseServer").getTables();
        const serverconfig = container.resolve("ConfigServer");
        const ragfairconfig = serverconfig.getConfig(ConfigTypes_1.ConfigTypes.RAGFAIR);
        ragfairconfig.traders["evgeshka"] = true;
        const blacklistItems = ["enot_mark", "enot_afak", "enot_etg", "enot_kondor", "enot_maska", "evg_mail", "evg_mail_pack", "evg_saiga23", "evg_rhino_338", "evg_bossfinder", "evg_akmsu", "evg_fake_slick", "evg_fake_altyn", "evg_mag_airsoftpistol", "evg_rhino_338_cyl", "evg_saiga23_mag1", "evg_saiga23_mag2", "evg_saiga23_mag3", "evg_blackhole_case", "evg_blackhole_secure", "evg_weaponcase", "5780cf7f2459777de4559322", "5ede7a8229445733cb4c18e2", "5d235bb686f77443f4331278", "6087e570b998180e9f76dc24", "628a60ae6b1d481ff772e9c8", "576165642459773c7a400233", "62987dfc402c7f69bf010923", "5eff09cd30a7dc22fd1ddfed"];
        for (const item in blacklistItems) {
            ragfairconfig.dynamic.blacklist.custom.push(blacklistItems[item]);
        }
        ragfairconfig.dynamic.presetPrice.min = 1.1;
        ragfairconfig.dynamic.presetPrice.max = 1.3;
        ragfairconfig.dynamic.price.min = 0.95;
        ragfairconfig.dynamic.offerItemCount.min = 2;
        ragfairconfig.dynamic.offerItemCount.max = 5;
        ragfairconfig.dynamic.rating.max = 10;
        ragfairconfig.dynamic.nonStackableCount.max = 5;
        ragfairconfig.dynamic.condition.conditionChance = 0.8;
        ragfairconfig.dynamic.condition.min = 0.9;
        ragfairconfig.sell.reputation.gain = 0.000002;
        ragfairconfig.sell.reputation.loss = 0.000002;
        //ragfairconfig.dynamic.offerAdjustment.maxPriceDifferenceBelowHandbookPercent = 0
    }
    ragfairPriceChanger(container) {
        const db = container.resolve("DatabaseServer").getTables();
        const ragfairPrices = db.templates.prices;
        const newPricedb = require("../db/ragfairprice.json");
        for (const item in newPricedb) {
            ragfairPrices[item] = newPricedb[item];
        }
    }
    fenceNerf(container) {
        const db = container.resolve("DatabaseServer").getTables();
        const serverconfig = container.resolve("ConfigServer");
        const traderconfig = serverconfig.getConfig(ConfigTypes_1.ConfigTypes.TRADER);
        const fencecfg = traderconfig.fence;
        fencecfg.maxPresetsPercent = 3;
        const blacklistarray = ["5795f317245977243854e041", "enot_mark", "enot_afak", "enot_etg", "enot_kondor", "enot_maska", "evg_mail", "evg_mail_pack", "evg_saiga23", "evg_rhino_338", "evg_bossfinder", "evg_rhino_338_cyl", "evg_saiga23_mag1", "evg_saiga23_mag2", "evg_saiga23_mag3", "evg_blackhole_case", "evg_blackhole_secure", "evg_weaponcase", "5448e54d4bdc2dcc718b4568", "5448e5284bdc2dcb718b4567", "5448e53e4bdc2d60728b4567", "5a341c4086f77401f2541505", "5d21f59b6dbe99052b54ef83", "5b3f15d486f77432d0509248", "5447e1d04bdc2dff2f8b4567", "5e81ebcd8e146c7080625e15", "6275303a9f372d6ea97f9ec7", "5671435f4bdc2d96058b4569", "59f32bb586f774757e1e8442", "59f32c3b86f77472a31742f0", "5c0530ee86f774697952d952", "57347ca924597744596b4e71", "5c12613b86f7743bbe2c3f76", "59e3639286f7741777737013", "5d03794386f77420415576f5", "5a1eaa87fcdbcb001865f75e", "5d1b5e94d7ad1a2b865a96b0", "5fc22d7c187fea44d52eda44", "627e14b21713922ded6f2c15", "5d1b36a186f7742523398433", "5d1b371186f774253763a656"];
        for (const item in blacklistarray) {
            fencecfg.blacklist.push(blacklistarray[item]);
        }
        for (const item in db.templates.handbook.Categories) {
            if (db.templates.handbook.Items[item].Id == "5e81ebcd8e146c7080625e15") {
                db.templates.handbook.Items[item].Price = 400000;
                break;
            }
        }
    }
    standingSetting(container) {
        const db = container.resolve("DatabaseServer").getTables();
        const serverconfig = container.resolve("ConfigServer");
        const bosses = ["bossbully", "bossgluhar", "bosskilla", "bossknight", "bosskojaniy", "bosssanitar", "bosstagilla", "followerbigpipe", "followerbirdeye", "followerbully", "followergluharassault", "followergluharscout", "followergluharsecurity", "followergluharsnipe", "followerkojaniy", "followersanitar"];
        const traders = db.bots.types;
        for (const boss in bosses) {
            traders[bosses[boss]].experience.standingForKill = -0.05;
        }
        const inraidconfig = serverconfig.getConfig(ConfigTypes_1.ConfigTypes.IN_RAID);
        inraidconfig.scavExtractGain = 0.05;
    }
    increaseHideout(container) {
        const db = container.resolve("DatabaseServer").getTables();
        const hideoutAreas = db.hideout.areas;
        const hideoutProductions = db.hideout.production;
        for (const area in hideoutAreas) {
            const stageList = hideoutAreas[area].stages;
            for (const stage in stageList) {
                if (stageList[stage].constructionTime != 0 && stageList[stage].constructionTime != null) {
                    stageList[stage].constructionTime /= 10;
                }
            }
        }
        for (const product in hideoutProductions) {
            if (hideoutProductions[product].productionTime == 0) {
                continue;
            }
            if (hideoutProductions[product].productionTime > 5000) {
                hideoutProductions[product].productionTime /= 5;
                continue;
            }
            hideoutProductions[product].productionTime /= 2;
        }
    }
    scavcaseNerf(container) {
        const serverconfig = container.resolve("ConfigServer");
        const scavcaseconfig = serverconfig.getConfig(ConfigTypes_1.ConfigTypes.SCAVCASE);
        scavcaseconfig.rewardItemBlacklist.push("evg_mail", "evg_mail_pack");
    }
    worsePmcArmor(container) {
        const db = container.resolve("DatabaseServer").getTables();
        const sides = ["usec", "bear"];
        const slickarmor = ["5e4abb5086f77406975c9342", "6038b4ca92ec1c3103795a0d", "6038b4b292ec1c3103795a0b"];
        const level6armor = ["5fd4c474dd870108a754b241", "5c0e625a86f7742d77340f62", "60a283193cb70855c43a381d"];
        for (const pmcside in sides) {
            const side = sides[pmcside];
            const armorvests = db.bots.types[side].inventory.equipment.ArmorVest;
            for (const armor in slickarmor) {
                armorvests[slickarmor[armor]] /= 5;
            }
            for (const armor in level6armor) {
                armorvests[level6armor[armor]] /= 3;
            }
        }
    }
    levelImprove(container) {
        const db = container.resolve("DatabaseServer").getTables();
        const leveltable = db.globals.config.exp.level.exp_table;
        for (let i = 42; i < 50; i++) {
            leveltable[i].exp = 200000;
        }
        for (let i = 50; i < 60; i++) {
            leveltable[i].exp = 250000;
        }
        for (let i = 60; i < 70; i++) {
            leveltable[i].exp = 300000;
        }
        for (let i = 70; i < 79; i++) {
            leveltable[i].exp = 500000;
        }
    }
    fixScavEquip(container) {
        const db = container.resolve("DatabaseServer").getTables();
        db.bots.types.assault.inventory.equipment.TacticalVest = {
            "544a5caa4bdc2d1a388b4568": 1,
            "5648a69d4bdc2ded0b8b457b": 5,
            "572b7adb24597762ae139821": 30,
            "5929a2a086f7744f4b234d43": 25,
            "592c2d1a86f7746dbe2af32a": 5,
            "59e7643b86f7742cbf2c109a": 25,
            "5ab8dab586f77441cd04f2a2": 5,
            "5c0e446786f7742013381639": 25,
            "5c0e6a1586f77404597b4965": 5,
            "5ca20abf86f77418567a43f2": 15,
            "5d5d646386f7742797261fd9": 20,
            "5e4abfed86f77406a2713cf7": 25,
            "5fd4c4fa16cac650092f6771": 30,
            "5fd4c5477a8d854fa0105061": 30,
            "5fd4c60f875c30179f5d04c2": 10,
            "6034cf5fffd42c541047f72e": 20,
            "6034d0230ca681766b6a0fb5": 30,
            "603648ff5a45383c122086ac": 5,
            "6040dd4ddcf9592f401632d2": 5
        };
    }
}
module.exports = { mod: new EvgeshkaTrader() };
