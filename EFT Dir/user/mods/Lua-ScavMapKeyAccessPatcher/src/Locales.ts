import { DependencyContainer } from "tsyringe";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";

import { Logger } from "./Logger";

export class Locales
{
    constructor(readonly container: DependencyContainer, readonly logger: Logger) {}

    load(): void
    {
        this.logger.debug("Loading Locales Patching...");
        this.PatchLocales();
        this.logger.debug("Completed Locales Patching...");
    }

    public PatchLocales()
    {
        const localeTitleKey = "Warning! You don’t have TerraGroup Labs access keycard!";
        const localeTitleReplaceKey = "NO KEYCARD IN INVENTORY";
        const localeDescKey = "Aquire specific single use keycard to proceed to infiltration";
        const localeDescReplaceKey = "hideout/Requirements are not fulfilled";
        const databaseServer = this.container.resolve<DatabaseServer>("DatabaseServer");
        const locales = databaseServer.getTables().locales.global;
        
        for (const lang in locales)
        {
            const locale = locales[lang];
            const targetTitleLocale = locale.interface[localeTitleKey];
            const targetDescLocale = locale.interface[localeDescKey];
            let descText = locale.interface[localeDescReplaceKey];

            if (!targetTitleLocale)
            {
                this.logger.error(`Locale "${lang}" doesn't have "${localeTitleKey}" key, skipping...`);
                continue;
            }

            if (!targetDescLocale)
            {
                this.logger.error(`Locale "${lang}" doesn't have "${localeDescKey}" key, skipping...`);
                continue;
            }

            if (!descText)
            {
                this.logger.error(`Locale "${lang}" doesn't have "${localeDescReplaceKey}" key, skipping...`);
                continue;
            }

            const splitTarget = targetTitleLocale.includes("!") ? "!" : "！";
            if (splitTarget === "！" && !targetTitleLocale.includes("！"))
            {
                this.logger.error(`Locale "${lang}" doesn't have "!" or "！" word to split for "${localeTitleKey}", skipping...`);
                continue;
            }

            this.logger.debug(`Applying locale "${lang}".interface."${localeTitleKey}"`);
            const splitText = targetTitleLocale.split(splitTarget);
            if (descText[descText.length-1] === ".") descText = descText.slice(0, -1);
            descText += splitTarget;
            locale.interface[localeTitleKey] = locale.interface[localeTitleReplaceKey];
            locale.interface[localeDescKey] = `${splitText[0]}${splitTarget} ${descText}`;
            this.logger.debug(`New locale:\n"${locale.interface[localeTitleKey]}"\n"${locale.interface[localeDescKey]}"`);
        }
    }
}