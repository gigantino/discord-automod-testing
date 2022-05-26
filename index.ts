import "dotenv/config";
import { Client, Intents } from "discord.js";
import axios from "axios";

const client = new Client({
	intents: new Intents(3145729)
});

client.once("ready", async () => {
	console.log(`[CLIENT] Logged in as '${client.user?.tag}'`);
});

client.on("raw", async (e) => {
	if (e.t !== "AUTO_MODERATION_ACTION_EXECUTION") return;

	const { guild_id, channel_id, rule_id, matched_keyword, content, action }: {
		guild_id: string,
		channel_id: string,
		rule_id: string,
		matched_keyword: string,
		content: string,
		action: {
			type: number
			metadata: {
				channel_id: string
			}
		}
	} = e.d;

	if (action.type !== 2) return;

	const guild = client.guilds.cache.get(guild_id);
	if (!guild?.me?.permissions.has("ADMINISTRATOR")) return console.error("Missing 'ADMINISTRATOR' perms.");
	const channel = guild.channels.cache.get(channel_id);
	if (!channel?.isText()) return;
	// Get the logging channel
	const logs = guild.channels.cache.get(action.metadata.channel_id);
	if (!logs?.isText()) return console.log("Missing logs channel.");
	
	// Get the filter name
	const { data } = await axios.get(`https://discord.com/api/v9/guilds/${guild.id}/auto-moderation/rules/${rule_id}`, {
		headers: {
			authorization: `Bot ${process.env.BOT_TOKEN}`
		}
	});
	const filterName = data?.name;
	if (!filterName) return;

	logs.send(`The filter **${filterName}** filter has caught the message **${content}** because of the word **${matched_keyword}**.`);
});

client.login(process.env.BOT_TOKEN);
