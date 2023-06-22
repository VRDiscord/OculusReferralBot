import {
    Interaction,
} from "discord.js";
import {BaseContextInitOptions} from "../types";
import { DiscordBotClient } from "./client";

export class BaseContext{
    interaction: Interaction
    client: DiscordBotClient
    constructor(options: BaseContextInitOptions) {
        this.interaction = options.interaction
        this.client = options.client
    }
}