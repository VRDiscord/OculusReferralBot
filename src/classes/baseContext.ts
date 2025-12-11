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

    get is_staff() {
        const member: any = (this.interaction as any).member
        const roles = member?.roles
        if(!roles || !this.client.config.staff_roles?.length) return false
        return Array.isArray(roles)
            ? roles.some((r: string) => this.client.config.staff_roles!.includes(r))
            : roles.cache?.some((r: any) => this.client.config.staff_roles!.includes(r.id)) ?? false
    }
}
