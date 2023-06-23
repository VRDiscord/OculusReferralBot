import {
    Interaction,
} from "discord.js";
import {BaseContextInitOptions} from "../types";
import { DiscordBotClient } from "./client";
import { Pool } from "pg";

export class BaseContext{
    interaction: Interaction
    client: DiscordBotClient
    database: Pool
    constructor(options: BaseContextInitOptions) {
        this.interaction = options.interaction
        this.client = options.client
        this.database = options.database
    }
}