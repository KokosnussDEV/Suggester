const { colors, developer, main_guild, global_override } = require("../../config.json");
const { dbQuery, checkPermissions, fetchUser } = require("../../coreFunctions");
module.exports = {
	controls: {
		name: "verify",
		permission: 10,
		usage: "verify",
		description: "Shows permissions of a user as they relate to the bot",
		enabled: true,
		docs: "all/verify",
		permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"]
	},
	do: async (message, client, args, Discord) => {
		let user = await fetchUser(args[0] ? args[0] : message.author.id, client);
		let id;
		if (user) id = user.id;
		else {
			user = message.author;
			id = message.author.id;
		}

		let qUserDB = await dbQuery("User", { id: id });
		let qServerDB = await dbQuery("Server", { id: message.guild.id });

		await message.guild.members.fetch(id).catch(() => {});
		await client.guilds.cache.get(main_guild).members.fetch(id).catch(() => {});

		let globalPosArr = [];
		let posArr = [];
		if (developer.includes(id)) globalPosArr.push("<:suggesterdev:689121648099459078> Developer");
		if (developer.includes(id)) globalPosArr.push("<:suggesteradmin:689138045122773006> Global Administrator");
		if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get(global_override).members.get(id)) globalPosArr.push("<:suggesterglobal:689121762952216625> Global Permissions");
		if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get("566029891590422566").members.get(id)) globalPosArr.push("<:suggestermod:689138045328293974> Suggester Server Moderator");
		if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get("566030511840034816").members.get(id)) globalPosArr.push("<:support:643571568638689332> Suggester Support Team");
		if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get("657644875499569161").members.get(id)) globalPosArr.push("<:bean:657650134502604811> Global Bean Permissions");
		if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get("614084573139173389").members.get(id)) globalPosArr.push("<:canary:621530343081508899> Suggester Canary Program");
		if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get("631986751375933446").members.get(id)) globalPosArr.push(":star: Suggester Contributor");
		if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get("574193409829634048").members.get(id)) globalPosArr.push("<:partner:689138870096363559> Suggester Partner");
		if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get("618893176295653397").members.get(id)) globalPosArr.push(":sunglasses: Super Supporter (Tier 3)");
		else if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get("640906114321612821").members.get(id)) globalPosArr.push(":sunglasses: Upper Tier Upvoter (Tier 2)");
		else if (client.guilds.cache.get(main_guild) && client.guilds.cache.get(main_guild).available && client.guilds.cache.get(main_guild).roles.cache.get("569954188675776522").members.get(id)) globalPosArr.push(":sunglasses: Supporter (Tier 1)");

		if (qUserDB.blocked) globalPosArr.push(":no_entry_sign: Blacklisted Globally");

		if (message.guild.members.cache.get(id) && message.guild.members.cache.get(id).hasPermission("MANAGE_GUILD")) {
			posArr.push(":tools: Server Admin");
		} else if (qServerDB && qServerDB.config.admin_roles && message.guild.members.cache.get(id)) {
			let adminRoles = 0;
			qServerDB.config.admin_roles.forEach((roleid) => {
				if (message.guild.members.cache.get(id).roles.cache.has(roleid)) adminRoles++;
			});
			if (adminRoles > 0) posArr.push(":tools: Server Admin");
		}

		if (qServerDB && qServerDB.config.staff_roles && message.guild.members.cache.get(id)) {
			let staffRoles = 0;
			qServerDB.config.staff_roles.forEach((roleid) => {
				if (message.guild.members.cache.get(id).roles.cache.has(roleid)) staffRoles++;
			});
			if (staffRoles > 0) posArr.push(":tools: Server Staff");
		}
		if (qServerDB && qServerDB.config.blacklist.includes(id)) posArr.push(":no_entry_sign: Blacklisted on this server");

		let hasAcks = false;
		let permissionLevel = await checkPermissions(message.guild.members.cache.get(id), client);
		let embed = new Discord.MessageEmbed()
			.setAuthor(user.tag, user.displayAvatarURL({format: "png", dynamic: true}))
			.setColor(colors.default)
			.setFooter(`Permission Level: ${permissionLevel}`);
		if (globalPosArr.length > 0) {
			embed.addField("Global Acknowledgements", `${globalPosArr.join("\n")}`);
			hasAcks = true;
		}
		if (posArr.length > 0) {
			embed.addField("Server Acknowledgements", `${posArr.join("\n")}`);
			hasAcks = true;
		}
		if (qUserDB.beans) {
			let beans = qUserDB.beans;
			let beanCountTotal = beans.sent.bean+beans.sent.megabean+beans.sent.nukebean+beans.received.bean+beans.received.megabean+beans.received.nukebean;
			if (beanCountTotal > 0) {
				const receivedBeanStats = [];
				const sentBeanStats = [];

				if(beans.received.bean > 0) receivedBeanStats.push(`<:bean:657650134502604811> ${beans.received.bean} beans`);
				if(beans.received.megabean > 0) receivedBeanStats.push(`<:hyperbean:666099809668694066> ${beans.received.megabean} megabeans`);
				if(beans.received.nukebean > 0) receivedBeanStats.push(`<:nukebean:666102191895085087> ${beans.received.nukebean} nukebeans`);

				if(beans.sent.bean > 0) sentBeanStats.push(`<:bean:657650134502604811> ${beans.sent.bean} beans`);
				if(beans.sent.megabean > 0) sentBeanStats.push(`<:hyperbean:666099809668694066> ${beans.sent.megabean} megabeans`);
				if(beans.sent.nukebean > 0) sentBeanStats.push(`<:nukebean:666102191895085087> ${beans.sent.nukebean} nukebeans`);

				if(receivedBeanStats.length > 0) {
					embed.addField("Received Bean Statistics <:bean:657650134502604811>", receivedBeanStats.join("\n"));
					hasAcks = true;
				}
				if(sentBeanStats.length > 0) {
					embed.addField("Sent Bean Statistics <:bean:657650134502604811>", sentBeanStats.join("\n"));
					hasAcks = true;
				}
			}
		}

		if (qUserDB.ack) embed.setDescription(qUserDB.ack);
		else if (!hasAcks) embed.setDescription("This user has no acknowledgements");

		return message.channel.send(embed);
	}
};
