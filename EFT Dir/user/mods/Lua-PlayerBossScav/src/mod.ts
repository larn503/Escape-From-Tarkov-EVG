/* eslint-disable @typescript-eslint/indent */
import { DependencyContainer } from "tsyringe";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { StaticRouterModService } from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import { PlayerScavGenerator } from "@spt-aki/generators/PlayerScavGenerator";
import { SaveServer } from "@spt-aki/servers/SaveServer";
import { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
import { BotHelper } from "@spt-aki/helpers/BotHelper";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { FenceService } from "@spt-aki/services/FenceService";
import { BotLootCacheService } from "@spt-aki/services/BotLootCacheService";
import { BotGenerator } from "@spt-aki/generators/BotGenerator";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { IPmcData } from "@spt-aki/models/eft/common/IPmcData";

import { PlayerBossScav } from "./PlayerBossScav";
import pkg from "../package.json";
import modConfig from "../config/config.json";
import evgConfig from "../../evgeshka/config/config.json"

class Mod implements IPostDBLoadMod, IPreAkiLoadMod
{
	protected modName = `${pkg.author}-${pkg.name}`;
	private static container: DependencyContainer;

	public preAkiLoad(container: DependencyContainer): void {
		//Replace scav generation method
		container.afterResolution("PlayerScavGenerator", (_t, playerScavGenerator: PlayerScavGenerator) => { 
			playerScavGenerator.generate = this.generate;
		}, { frequency: "Always" });

		//Hook game start router
		if (modConfig.GenerateScavProfileOnStartup === true)
		{
			container.resolve<StaticRouterModService>("StaticRouterModService").registerStaticRouter(
				`${this.modName}-/client/game/start`,
				[
					{
						url: "/client/game/start",
						action: (url: string, info: any, sessionID: string, output: string): any => 
						{
							this.generate(sessionID);
							return output;
						}
					}
				],
				"aki"
			);
		}
	}

    public postDBLoad(container: DependencyContainer): void
	{
		// SPT 3.0.0
		Mod.container = container;

		const logger: ILogger = container.resolve<ILogger>("WinstonLogger");
        logger.info(`Loading: ${this.modName} ${pkg.version}${modConfig.Enabled === true ? "" : " [Disabled]"}`);
		if (!modConfig?.Enabled || !evgConfig.scavRework)
		{
			return;
		}

		// Database Server Tables
		const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
		const tables = databaseServer.getTables();

		// Scav Role List Check
		for (let [ key, value ] of Object.entries(modConfig) )
		{
			if (typeof(value) !== "object" || modConfig[key].RoleList === undefined) continue;
			for (const roleKey of modConfig[key].RoleList) {
				const roleName: string = typeof(roleKey) === "string" ? roleKey.toLowerCase() : roleKey.toString();
				if (tables.bots.types[roleName] === undefined || tables.bots.types[roleName].health.BodyParts[0].Head.min === 0)
				{
					const i = modConfig[key].RoleList.indexOf(roleKey);
					if (i > -1)
					{
						modConfig[key].RoleList.splice(i, 1);
						logger.error(`${this.modName} - Bad "${key}" Role Type: "${roleName}", Removed...`);
					}
					else
					{
						logger.error(`${this.modName} - Bad "${key}" Role Type: "${roleName}" and couldn't delete from the list - Mod disabled...`);
						return;
					}
				}
			}
		}

		// Scav Cooldown
		if(modConfig.ScavPlayCooldown >= 0) {
			tables.globals.config.SavagePlayCooldown = modConfig.ScavPlayCooldown < 0 ? 0 : modConfig.ScavPlayCooldown;
		}

	}

	public generate(sessionID: string): IPmcData
	{
		return new PlayerBossScav(
			Mod.container.resolve<ILogger>("WinstonLogger"),
			Mod.container.resolve<DatabaseServer>("DatabaseServer"),
			Mod.container.resolve<SaveServer>("SaveServer"),
			Mod.container.resolve<ProfileHelper>("ProfileHelper"),
			Mod.container.resolve<BotHelper>("BotHelper"),
			Mod.container.resolve<JsonUtil>("JsonUtil"),
			Mod.container.resolve<FenceService>("FenceService"),
			Mod.container.resolve<BotLootCacheService>("BotLootCacheService"),
			Mod.container.resolve<BotGenerator>("BotGenerator"),
			Mod.container.resolve<ConfigServer>("ConfigServer")
		).generatePlayerScav(sessionID, Mod.container);
	}
}

module.exports = { mod: new Mod() }