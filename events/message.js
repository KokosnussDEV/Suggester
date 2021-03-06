const core = require("../coreFunctions.js");
const { dbQuery, checkConfig } = require("../coreFunctions");
const { emoji, colors, prefix } = require("../config.json");
module.exports = async (Discord, client, message) => {
	if (message.channel.type !== "text") {
		let dmEmbed = new Discord.MessageEmbed()
			.setDescription(message.content);
		if (message.channel.type === "dm" && client.user.id !== message.author.id) return core.coreLog(`:e_mail: **${message.author.tag}** (\`${message.author.id}\`) sent a DM to the bot:`, dmEmbed);
		return;
	}
	if (message.author.bot === true) return;

	let permission = await core.checkPermissions(message.member, client);

	let qServerDB = await dbQuery("Server", { id: message.guild.id });
	let serverPrefix = (qServerDB && qServerDB.config && qServerDB.config.prefix) || prefix;

	let possiblementions = [`<@${client.user.id}> help`, `<@${client.user.id}>help`, `<@!${client.user.id}> help`, `<@!${client.user.id}>help`, `<@${client.user.id}> prefix`, `<@${client.user.id}>prefix`, `<@!${client.user.id}> prefix`, `<@!${client.user.id}>prefix`, `<@${client.user.id}> ping`, `<@${client.user.id}>ping`, `<@!${client.user.id}> ping`, `<@!${client.user.id}>ping`];
	if (possiblementions.includes(message.content.toLowerCase())) {
		let missingConfig = checkConfig(qServerDB);
		return message.reply(`Hi there! My prefix in this server is \`${Discord.escapeMarkdown(serverPrefix)}\`\nYou can read more about my commands at https://suggester.gitbook.io/${missingConfig.length >= 1 ? "\n> This server is not fully configured yet! A server manager can run `" + serverPrefix + "setup` to easily configure it!": ""}`);
	}

	if (permission <= 1 && message.content.toLowerCase().startsWith("suggester:")) serverPrefix = "suggester:";
	if (permission <= 1 && message.content.toLowerCase().startsWith(`${client.user.id}:`)) serverPrefix = `${client.user.id}:`;
	if (!message.content.toLowerCase().startsWith(serverPrefix)) return;
	let args = message.content.split(" ");
	let commandName = args.shift().slice(serverPrefix.length).toLowerCase();
	
	const command = client.commands.find((c) => c.controls.name.toLowerCase() === commandName || c.controls.aliases && c.controls.aliases.includes(commandName));
	if (!command) return;

	let contentEmbed = new Discord.MessageEmbed()
		.setDescription(message.content);

	if (command.controls.enabled === false) {
		core.commandLog(`🚫 ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`) but the command is disabled.`, contentEmbed);
		return message.channel.send("This command is currently disabled globally.");
	}
	if (permission > command.controls.permission) {
		core.commandLog(`🚫 ${message.author.tag} (\`${message.author.id}\`) attempted to run command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`) but did not have permission to do so.`, contentEmbed);
		return message.react("🚫");
	}
	core.commandLog(`:wrench: ${message.author.tag} (\`${message.author.id}\`) ran command \`${commandName}\` in the **${message.channel.name}** (\`${message.channel.id}\`) channel of **${message.guild.name}** (\`${message.guild.id}\`).`, contentEmbed);

	if (command.controls.permissions) {
		let channelPermissions = message.channel.permissionsFor(client.user.id);
		let list = [];
		const permissionNames = require("../utils/permissions.json");
		command.controls.permissions.forEach(permission => {
			if (!channelPermissions.has(permission)) list.push(permissionNames[permission]);
		});
		if (list.length >= 1) {
			if (channelPermissions.has("EMBED_LINKS")) {
				//Can embed
				let embed = new Discord.MessageEmbed()
					.setDescription(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${message.channel.id}> channel:`)
					.addField("Missing Elements", `<:${emoji.x}> ${list.join(`\n<:${emoji.x}> `)}`)
					.addField("How to Fix", `In the channel settings for <#${message.channel.id}>, make sure that **${client.user.username}** has a <:${emoji.check}> for the above permissions.`)
					.setColor(colors.red);
				return message.channel.send(embed).catch(() => {
					message.author.send(`Your command \`${commandName}\` used in <#${message.channel.id}> failed to execute because <@${client.user.id}> does not have the **Send Messages** permission in that channel. Please make sure <@${client.user.id}> can send messages and try again.`).catch(() => {});
				});
			} else {
				//Cannot embed
				return message.channel.send(`This command cannot be run because some permissions are missing. ${client.user.username} needs the following permissions in the <#${message.channel.id}> channel:\n - ${list.join("\n- ")}\nIn the channel settings for <#${message.channel.id}>, make sure that **${client.user.username}** has the following permissions allowed.`).catch(() => {
					message.author.send(`Your command \`${commandName}\` used in <#${message.channel.id}> failed to execute because <@${client.user.id}> does not have the **Send Messages** permission in that channel. Please make sure <@${client.user.id}> can send messages and try again.`).catch(() => {});
				});
			}
		}
	}

	try {
		return command.do(message, client, args, Discord);
	} catch (err) {
		message.channel.send(`<:${emoji.x}> Something went wrong with that command, please try again later.`);
		core.errorLog(err, "Command Handler", `Message Content: ${message.content}`);
	}
};
