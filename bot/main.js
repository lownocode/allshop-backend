
import { VK } from "vk-io";
import { HearManager } from "@vk-io/hear";

import config from "../config.js";
import { getDonuts } from "../functions/getDonuts.js";

import * as commands from "./commands/index.js";

export const vk = new VK({ token: config.bot.token });
const hearManager = new HearManager();

vk.updates.on("message", async (message, next) => {
    if(message.isOutbox) return;
    await next();
});
vk.updates.on("message", hearManager.middleware);

Object.values(commands).forEach(({ RegExp, handler }) => hearManager.hear(RegExp, handler));

setInterval(getDonuts, 15000);

console.log(`vk bot started`);
vk.updates.start();