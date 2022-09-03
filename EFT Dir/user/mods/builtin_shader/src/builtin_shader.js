"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class builtin_shader {
    constructor() {
        this.mod = "builtin_shader";
    }
    preAkiLoad(container) {
        //Logger
        const logger = container.resolve("WinstonLogger");
        logger.info("Loading: builtin_shader");
    }
}
module.exports = { mod: new builtin_shader() };
