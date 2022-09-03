import { DependencyContainer } from "tsyringe";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";

import pkg from "../package.json";
export class Logger
{
	readonly prefix = pkg.author+"-"+pkg.name;

    constructor(readonly container: DependencyContainer) {}

    get logger(): ILogger
    {
        return this.container.resolve<ILogger>("WinstonLogger");
    }
  
    info(data: string): void
    {
      this.logger.info(`${this.prefix} - ${data}`);
    }
  
    debug(data: string | Record<string, unknown>, onlyShowInConsole?: boolean): void
    {
      this.logger.debug(`${this.prefix} - ${data}`, onlyShowInConsole);
    }
  
    log(data: string | Record<string, unknown> | Error, color: string, backgroundColor?: string): void
    {
      this.logger.log(`${this.prefix} - ${data}`, color, backgroundColor);
    }
  
    error(data: string): void
    {
      this.logger.error(`${this.prefix} - ${data}`);
    }
  
    warning(data: string): void
    {
      this.logger.warning(`${this.prefix} - ${data}`);
    }
  
    success(data: string): void
    {
      this.logger.success(`${this.prefix} - ${data}`);
    }

    loading(): void
    {
      this.logger.info(`Loading: ${this.prefix} ${pkg.version}`);
    }

    complete(): void
    {
      this.logger.success(`${this.prefix} - Successfully patched`);
    }
}