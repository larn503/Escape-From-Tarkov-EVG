"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_json_1 = __importDefault(require("../../evgeshka/config/config.json"));
class GF2_Character {
    constructor() {
        this.mod = "GF2_Character";
    }
    preAkiLoad(container) {
        //Logger
        this.logger = container.resolve("WinstonLogger");
        this.logger.info(`[${this.mod}] Loading`);
    }
    postDBLoad(container) {
        this.logger.debug(`[${this.mod}] Delayed Loading... `);
        //Server database
        const databaseServer = container.resolve("DatabaseServer");
        const tables = databaseServer.getTables();
        //New database
        const custom = require("../db/templates/customization.json");
        const lang = require("../db/locales/en.json");
        //Add customization
        for (const skin in custom) {
            tables.templates.customization[skin] = custom[skin];
        }
        if (config_json_1.default.animeMode) {
            //Add character
            const suits = require("../db/traders/5ac3b934156ae10c4430e83c.json");
            const char = require("../db/templates/character.json");
            for (const ca in char) {
                tables.templates.character.push(char[ca]);
            }
            //Remove vanila heads
            const vanilaHeads = ["62aca6a1310e67685a2fc2e7", "619f9e338858a474c8685cc9", "60a6aa8fd559ae040d0d951f", "5fdb4139e4ed5b5ea251e4ed", "5fdb5950f5264a66150d1c6e", "62a9e7d15ea3b87d6f642a28", "619f94f5b90286142b59d45f", "60a6aaad42fd2735e4589978", "5fdb7571e4ed5b5ea251e529", "5fdb50bb2b730a787b3f78cf"];
            const temparray = [];
            for (const head in tables.templates.character) {
                if (!vanilaHeads.find(x => (x == tables.templates.character[head]))) {
                    temparray.push(tables.templates.character[head]);
                }
            }
            tables.templates.character = temparray;
            //Add profiles
            const profiles = tables.templates.profiles;
            for (const subprofile in profiles) {
                const profile = profiles[subprofile];
                for (const side in profile) {
                    if (side == "usec") {
                        this.logger.debug(profile[side].character.Customization.Body);
                        profile[side].character.Customization.Body = "Charolicr01body111111111";
                        profile[side].character.Customization.Feet = "Charolicr01leg1111111111";
                        profile[side].character.Customization.Hands = "Charolicr01hands11111111";
                        profile[side].suits = ["Charolicr01kit1111111111", "Charolicr01kit2222222222"];
                        this.logger.debug(`for ${subprofile} and side ${side} we added changes`);
                        continue;
                    }
                    if (side == "bear") {
                        profile[side].character.Customization.Body = "Grozar01body111111111111";
                        profile[side].character.Customization.Feet = "Grozar01leg1111111111111";
                        profile[side].character.Customization.Hands = "Grozar01hands11111111111";
                        profile[side].suits = ["Grozar01kit1111111111111", "Grozar01kit2222222222222"];
                        this.logger.debug(`for ${subprofile} and side ${side} we added changes`);
                        continue;
                    }
                }
            }
            tables.traders["5ac3b934156ae10c4430e83c"].suits = suits.suits;
        }
        //Add locales to game
        for (const item in lang.templates) {
            tables.locales.global.en.templates[item] = lang.templates[item];
            tables.locales.global.ru.templates[item] = lang.templates[item];
        }
    }
}
module.exports = { mod: new GF2_Character() };
