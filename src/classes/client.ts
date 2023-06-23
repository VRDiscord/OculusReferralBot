import SuperMap from "@thunder04/supermap";
import { Client, ClientOptions } from "discord.js";
import { readFileSync } from "fs";
import { Store } from "../stores/store";
import { Config, StoreTypes } from "../types";
import { Pool } from "pg";

export class DiscordBotClient extends Client {
	commands: Store<StoreTypes.COMMANDS>;
	components: Store<StoreTypes.COMPONENTS>;
	contexts: Store<StoreTypes.CONTEXTS>;
	modals: Store<StoreTypes.MODALS>;
    config: Config
	cache: SuperMap<string, any>
	regexes: {
		GAME_NAME: RegExp,
		APP_LINK: RegExp,
		DEVICE_LINK: RegExp
	}

	constructor(options: ClientOptions) {
		super(options);
		this.commands = new Store<StoreTypes.COMMANDS>({files_folder: "/commands", load_classes_on_init: false, storetype: StoreTypes.COMMANDS});
		this.components = new Store<StoreTypes.COMPONENTS>({files_folder: "/components", load_classes_on_init: false, storetype: StoreTypes.COMPONENTS});
		this.contexts = new Store<StoreTypes.CONTEXTS>({files_folder: "/contexts", load_classes_on_init: false, storetype: StoreTypes.CONTEXTS});
		this.modals = new Store<StoreTypes.MODALS>({files_folder: "/modals", load_classes_on_init: false, storetype: StoreTypes.MODALS});
        this.config = {}
		this.cache = new SuperMap({
			intervalTime: 1000
		})
        this.loadConfig()
		this.regexes = {
			GAME_NAME: /\<title id\=\"pageTitle\"\>([\d\D]+) on Oculus (Quest|Rift) \| Oculus\<\/title\>/,
			APP_LINK: /https\:\/\/www\.oculus\.com\/appreferrals\/[a-zA-Z0-9]+\/\d+\/?/,
			DEVICE_LINK: /https\:\/\/www\.oculus\.com\/referrals\/link\/[a-zA-Z0-9]+\/?/
		}
	}

    loadConfig() {
        const config = JSON.parse(readFileSync("./config.json").toString())
        this.config = config as Config
    }

	async getSlashCommandTag(name: string) {
		const commands = await this.application?.commands.fetch()
		if(!commands?.size) return `/${name}`
		else if(commands?.find(c => c.name === name)?.id) return `</${name}:${commands?.find(c => c.name === name)!.id}>`
		else return `/${name}`
	}

	async fetchGame(id: string, database: Pool) {
		const game = await database.query("SELECT * FROM games WHERE game_id=$1", [id]).then(res => res.rows[0]).catch(console.error)
		if(game?.name && game?.platform) return {name: game.name, platform: game.platform}

		const f = await fetch(`https://www.oculus.com/deeplink/?action=view&path=app/${id}/`, {
			"headers": {
				"sec-fetch-site": "same-origin",
			},
			"method": "GET"
		});
		if(f.status !== 200) return null
		const res = await f.text()
		if(!res) return;
		const data = res.match(this.regexes.GAME_NAME)
		if(!data?.at(1) || !data?.at(2)) return null
		else await database.query("INSERT INTO games (game_id, name, platform) VALUES ($1, $2, $3) ON CONFLICT (game_id) DO NOTHING", [id, data.at(1), data.at(2)?.toLowerCase()]).catch(console.error)
		return {
			name: data?.at(1),
			platform: data?.at(2)?.toLowerCase()
		}
	}

	async referralExists(url: string) {
		const res = await fetch(url, {method: "HEAD", "headers": {"sec-fetch-site": "same-origin"}})
		return res.status === 200
	}

	randomizeArray(array: any[]) {
		let currentIndex = array.length,  randomIndex;
		while (currentIndex != 0) {
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;
			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}
		return array;
	}
}
