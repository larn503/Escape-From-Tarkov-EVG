import { DependencyContainer } from "tsyringe";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";

import { Logger } from "./Logger";
import config from "../config/config.json";
import evgcfg from "../../evgeshka/config/config.json"
export class Locations
{
    constructor(readonly container: DependencyContainer, readonly logger: Logger) {
    }

    load(): void
    {
        this.logger.debug("Loading Locations Patching...");
        if (evgcfg.scavRework) this.PatchMaps();
        this.logger.debug("Completed Locations Patching...");
    }

    public PatchMaps(): void
    {
        const databaseServer = this.container.resolve<DatabaseServer>("DatabaseServer");
        const locations = databaseServer.getTables().locations;
        
        for (const map in locations)
        {
            const base = locations[map].base;
            const mapConfig = config[map];

            /* Filtering Map */
            if (map.toLowerCase() === "base" || base.Locked === true || base?.EnabledCoop === undefined)
            {
                this.logger.debug(`Not an valid map "${map}", skipping...`);
                continue;
            }

            /* DisabledForScav */
            if (mapConfig?.DisabledForScav !== undefined)
            {
                if (base?.DisabledForScav !== mapConfig?.DisabledForScav)
                {
                    this.logger.debug(`Applying "${map}".DisabledForScv to "${mapConfig.DisabledForScav}"`);
                    base.DisabledForScav = mapConfig.DisabledForScav;
                }
            }
        }
    }
}