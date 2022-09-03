import { DependencyContainer } from "tsyringe";

import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";

class builtin_shader implements IPreAkiLoadMod, IPostDBLoadMod
{
    mod: string
    logger: ILogger
    constructor() {
        this.mod = "builtin_shader";
    }

    public preAkiLoad(container: DependencyContainer): void
    { 
        //Logger
        const logger = container.resolve<ILogger>("WinstonLogger");
		
        logger.info("Loading: builtin_shader");	
    }
}

module.exports = { mod: new builtin_shader() }