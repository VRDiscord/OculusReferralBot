import SuperMap from "@thunder04/supermap";
import { Client, ClientOptions } from "discord.js";
import { readFileSync } from "fs";
import { Store } from "../stores/store";
import { Config, StoreTypes } from "../types";

export class DiscordBotClient extends Client {
	commands: Store<StoreTypes.COMMANDS>;
	components: Store<StoreTypes.COMPONENTS>;
	contexts: Store<StoreTypes.CONTEXTS>;
	modals: Store<StoreTypes.MODALS>;
    config: Config
	cache: SuperMap<string, any>
	regexes: {
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
			DEVICE_LINK: /https\:\/\/www\.(oculus|meta)\.com\/referrals\/link\/[a-zA-Z0-9_.]+\/?/
		}
	}

    loadConfig() {
        try {
            const config = JSON.parse(readFileSync("./config.json").toString())
            this.config = config as Config
        } catch {
            this.config = {}
        }
    }

	async getSlashCommandTag(name: string) {
		const commands = await this.application?.commands.fetch()
		if(!commands?.size) return `/${name}`
		else if(commands?.find(c => c.name === name)?.id) return `</${name}:${commands?.find(c => c.name === name)!.id}>`
		else return `/${name}`
	}

	unEscape(htmlStr?: string) {
		let str = htmlStr || ""
		str = str.replace(/&lt;/g , "<");	 
		str = str.replace(/&gt;/g , ">");     
		str = str.replace(/&quot;/g , "\"");  
		str = str.replace(/&#39;/g , "\'");   
		str = str.replace(/&amp;/g , "&");
		return str;
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

	generateTable(table: (string | number)[][]) {
		let rotated = table.slice()
		rotated = rotated[0]!.map((_, index) => rotated.map(row => row[index]!).reverse())

		const width_columns = rotated.map(r => r.sort((a, b) => b.toString().length - a.toString().length)[0]?.toString().length || 0)

		const rows = table.map(v => v.map((a, i) => a.toString().padStart(width_columns[i] || 0, " ")).join(" | "))

		rows.splice(1, 0, "-".repeat(rows[0]?.length || 0))

		return rows.join("\n")
	}
}
