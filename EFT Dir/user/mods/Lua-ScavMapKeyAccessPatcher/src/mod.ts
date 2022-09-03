import { DependencyContainer } from "tsyringe";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";

import { Logger } from "./Logger";
import { Locations } from "./Locations";
import { Locales } from "./Locales";
import { Save } from "./Save";
import { ClientHandler } from "./ClientHandler";

class Mod implements IPostDBLoadMod
{
    public postDBLoad(container: DependencyContainer): void
	{
		const logger = new Logger(container);
		logger.loading();
		new Locations(container, logger).load();
		new Locales(container, logger).load();
		new Save(container, logger).load();
		new ClientHandler(container, logger).load();
		logger.complete();
	}
}

export const mod = new Mod();