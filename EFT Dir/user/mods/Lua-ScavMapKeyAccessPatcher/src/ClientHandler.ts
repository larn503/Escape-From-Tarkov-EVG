import { DependencyContainer } from "tsyringe";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { StaticRouterModService } from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import { HttpResponseUtil } from "@spt-aki/utils/HttpResponseUtil";

import { Logger } from "./Logger";
import configoff from "../config/offconfig.json";
import evgcfg from "../../evgeshka/config/config.json"

export class ClientHandler
{
    private config;
    private raidmaplist = {};
    constructor(readonly container: DependencyContainer, readonly logger: Logger) {
        this.config = require("../config/config.json")
    }

    load(): void
    {
        this.logger.debug("Loading ClientHandler...");
    
        const staticRouterModService = this.container.resolve<StaticRouterModService>("StaticRouterModService");
        const httpResponseUtil = this.container.resolve<HttpResponseUtil>("HttpResponseUtil");

        staticRouterModService.registerStaticRouter(
            "Lua-ScavMapKeyAccessPatcher-/Lua/ScavMapAccessKeyPatcher/config",
            [
                {
                    url: "/Lua/ScavMapAccessKeyPatcher/config",
                    action: (url, info, sessionID, output): any => 
                    {
                        return JSON.stringify(this.getMapConfig());
                    }
                }
            ],
            "Lua-ScavMapKeyAccessPatcher"
        );

        staticRouterModService.registerStaticRouter(
            "Lua-ScavMapKeyAccessPatcher-/Lua/ScavMapAccessKeyPatcher/maptime",
            [
                {
                    url: "/Lua/ScavMapAccessKeyPatcher/maptime",
                    action: (url, info, sessionID, output): any => 
                    {
                        return JSON.stringify(this.getMapTime());
                    }
                }
            ],
            "Lua-ScavMapKeyAccessPatcher"
        );

        this.logger.debug("Completed ClientHandler Loading...");
        
    }

    public getMapTime(): any
    {
        const databaseServer = this.container.resolve<DatabaseServer>("DatabaseServer");
        const tables = databaseServer.getTables();
        if (!evgcfg.scavRework) {
            this.config = configoff
            for (const map of Object.keys(this.config))
            {
                this.raidmaplist[map] = "-1"
            }
        }
        else
        {
            for (const map of Object.keys(this.config))
            {
                this.raidmaplist[map] = tables.locations[map].base.EscapeTimeLimit
            }
        }
        this.logger.debug(`Sending maptime to client...\n${this.raidmaplist}`);
        return this.raidmaplist;
    }

    public getMapConfig(): any
    {
        const databaseServer = this.container.resolve<DatabaseServer>("DatabaseServer");
        const items = databaseServer.getTables().templates.items;

        const list = {};
        for (const map of Object.keys(this.config))
        {
            const keyItem = this.config[map]?.AccessKey || null;
            const item = items[keyItem] || null;

            if (!keyItem)
            {
                continue;
            }

            if (!item)
            {
                this.logger.error(`Map "${map}" has bad "AccessKey" item that doesn't exist "${keyItem}", skipping item...`);
                continue;
            }

            if (item?._type != "Item")
            {
                this.logger.error(`Map "${map}" has bad "AccessKey" key which is not an item "${keyItem}", skipping item...`);
                continue;
            }

            list[map] = keyItem;
        }
        this.logger.debug(`Sending config to client...\n${list}`);
        return list;
    }
}