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
		APP_NAME: RegExp,
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
			APP_NAME: /\<title\>(.+) on (Meta|Oculus) (Quest( \d)?|Rift|Go) \| (Oculus|Rift|Quest) VR [gG]ames\<\/title\>/,
			APP_LINK: /https\:\/\/www\.(oculus|meta)\.com\/appreferrals\/[a-zA-Z0-9_.]+\/\d+\/?/,
			DEVICE_LINK: /https\:\/\/www\.(oculus|meta)\.com\/referrals\/link\/[a-zA-Z0-9_.]+\/?/
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

	async fetchApp(id: string, platform: string, database: Pool) {
		const app = await database.query("SELECT * FROM apps WHERE app_id=$1", [id]).then(res => res.rows[0]).catch(console.error)
		if(app?.name && app?.platform) return {name: app.name, platform: app.platform}

		const options = {
			method: 'GET',
			'headers': {
			  	'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
			  	'accept-language': 'en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7',
			  	'cache-control': 'no-cache',
			  	'pragma': 'no-cache',
			  	'sec-ch-ua': ' "\\"Chromium\\";v=\\"116\\", \\"Not)A;Brand\\";v=\\"24\\", \\"Google Chrome\\";v=\\"116\\"",',
			  	'sec-ch-ua-mobile': '?0',
			  	'sec-ch-ua-platform': '"Windows\\"',
			  	'sec-fetch-dest': 'document',
			  	'sec-fetch-mode': 'navigate',
			  	'sec-fetch-site': 'none',
			  	'sec-fetch-user': '?1',
			  	'upgrade-insecure-requests': '1',
			  	'Cookie': 'locale=en_US'
			}
		}

		if(this.config.dev) console.log(`https://www.oculus.com/experiences/${platform}/${id}`)
		const f = await fetch(`https://www.oculus.com/experiences/${platform}/${id}`, options);
		if(this.config.dev) console.log(f)
		if(f.status !== 200) return null
		const res = await f.text()
		if(this.config.dev) console.log(res)
		if(!res) return;
		const data = this.regexes.APP_NAME.exec(res)
		if(this.config.dev) console.log(data)
		if(!data?.at(1) || !data?.at(3)) return null
		else await database.query("INSERT INTO apps (app_id, name, platform) VALUES ($1, $2, $3) ON CONFLICT (app_id) DO NOTHING", [id, this.unEscape(data.at(1)), data.at(3)?.toLowerCase()]).catch(console.error)
		return {
			name: data?.at(1),
			platform: data?.at(3)?.toLowerCase()
		}
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
