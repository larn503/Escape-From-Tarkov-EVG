import { DependencyContainer } from "tsyringe";
import { SaveServer } from "@spt-aki/servers/SaveServer";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { StaticRouterModService } from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import { ISaveProgressRequestData } from "@spt-aki/models/eft/inRaid/ISaveProgressRequestData";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { VFS } from "@spt-aki/utils/VFS";

import { Logger } from "./Logger";
import config from "../config/config.json";

export class Save
{
    constructor(readonly container: DependencyContainer, readonly logger: Logger) {}

    load(): void
    {
        this.logger.debug("Loading Save Patching...");

        const staticRouterModService = this.container.resolve<StaticRouterModService>("StaticRouterModService");
        staticRouterModService.registerStaticRouter(
            "Lua-ScavMapKeyAccessPatcher-/raid/profile/save",
            [
                {
                    url: "/raid/profile/save",
                    action: (url: string, info: any, sessionID: string, output: string): any => 
                    {
                        this.PatchSave(info, sessionID);
                        return output;
                    }
                }
            ],
            "aki"
        );

        this.logger.debug("Completed Save Patching...");
    }

    public PatchSave(offraidData: ISaveProgressRequestData, sessionID: string): void
    {
        const saveServer = this.container.resolve<SaveServer>("SaveServer");
        const profile = saveServer.getProfile(sessionID);
        const pmcData = profile.characters.pmc;
        const profileFile = this.container.resolve<JsonUtil>("JsonUtil").deserialize( this.container.resolve<VFS>("VFS").readFile(`user/profiles/${sessionID}.json`) ); // Cover your eyes
        profile.inraid.location = profileFile.inraid.location; // need to grab from file instead of saveserver, weirdly.
        const locationName = profile.inraid.location.toLowerCase();
        //const mapKey = this.container.resolve<DatabaseServer>("DatabaseServer").getTables()?.locations[locationName]?.base?.AccessKeys[0] || "none";
        const mapKey = config[locationName].AccessKey

        if (!offraidData.isPlayerScav)
        {
            this.logger.debug("Not an scav raid, skipping...");
            return;
        }

        if (!mapKey || mapKey === "none")
        {
            this.logger.warning("No raid location info found from the server, no access key were removed...");
            return;
        }

        if (!config[locationName]?.RemoveAccessKeyAfterRaid)
        {
            this.logger.debug(`"${locationName}" has access key with no removeal config, skipping...`);
            return;
        }

        for (const i in pmcData.Inventory.items)
        {
            const item = pmcData.Inventory.items[i];
            if (item._tpl === mapKey && item.slotId != "hideout")
            {
                this.logger.debug(`Access key item found: "${item._id}" on pmc inventory, removed...`);
                if (item?.upd?.StackObjectsCount > 1)
                {
                    this.logger.debug(`Stacked item, Reduce stack instead of removeal...`);
                    item.upd.StackObjectsCount--;
                }
                else
                {
                    pmcData.Inventory.items.splice(i, 1);
                    for (let j = 0; j < pmcData.Inventory.items.length; j++)
                    {
                        const childitem = pmcData.Inventory.items[j];
                        if (childitem.parentId === item._id)
                        {
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