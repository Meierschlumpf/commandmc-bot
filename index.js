const dotenv = require("dotenv");
const fs = require("node:fs");
const path = require("node:path");
dotenv.config();

const DiscordJs = require("discord.js");

const { Client, GatewayIntentBits, Collection, Events } = DiscordJs;
const {
  verifications,
  sentences,
  messageErrorMiddleware,
} = require("./helpers.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
  partials: ["CHANNEL"],
});

const BEDWARS_IDEAS_CHANNEL_ID = "939589435861925939";
const GIVEAWAY_BOT_ID = "294882584201003009";
const JOINME_CHANNEL_ID = "613138296540758051";
const COMMANDMC_GUILD_ID = "607504566812147762";
const CONSTRUCT_SENTENCE_CHANNEL_ID = "715242907564769330";

client.login(process.env.DISCORD_TOKEN);

client.commands = new Collection();
const commandFolderPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandFolderPath);

for (const file of commandFiles) {
  const filePath = path.join(commandFolderPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

client.once("ready", () => {
  console.log("Ready!");
});

client.on(Events.InteractionCreate, async (interaction) => {
  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  if (interaction.isAutocomplete()) {
    try {
      await command.autocomplete(interaction);
    } catch (err) {
      console.log(err);
    }
  }

  if (!interaction.isChatInputCommand()) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

const handleGiveawayBotMessage = (message) => {
  if (message.embeds.length == 0) return;

  const embed = message.embeds[0];

  const end = new Date(
    parseInt(
      embed.description
        .split("Ends: ")[1]
        .split("(")[0]
        .split("<t:")[1]
        .split(":R>")[0]
    ) * 1000
  );
  const description = embed.description.split("\n\n")[0];
  console.log(embed.description.split("Winners: ")[1]);
  const winnerCount = parseInt(
    embed.description.split("Winners: ")[1].split(".")[0].replaceAll("*", "")
  );

  const giveaway = {
    end,
    description,
    winnerCount,
    title: embed.title,
  };
};

client.on("messageCreate", async (message) => {
  messageErrorMiddleware(async () => {
    if (message.author.id === GIVEAWAY_BOT_ID) {
      handleGiveawayBotMessage(message);
    }

    if (message.author.bot) return;

    if (message.channelId === BEDWARS_IDEAS_CHANNEL_ID) {
      await message.react("🔼");
      await message.react("🔽");
      return;
    }

    if (message.channelId === CONSTRUCT_SENTENCE_CHANNEL_ID) {
      if (message.content.startsWith("//")) return;

      if (message.content.includes(" ")) {
        const warn = await message.reply({
          content: "Bitte sende immer nur ein Wort gleichzeitig.",
          ephemeral: true,
        });

        setTimeout(() => {
          try {
            warn.delete();
          } catch (err) {
            console.log("An error occured when deleting the latest warning.");
          }
        }, 5000);

        await message.delete();
        return;
      }

      const currentData = sentences.get();
      if (currentData.userId === message.author.id) {
        const warn = await message.reply({
          content: "Bitte warte, bis jemand anderes den Satz fortgesetzt hat!.",
          ephemeral: true,
        });
        await message.delete();

        setTimeout(() => {
          try {
            warn.delete();
          } catch (err) {
            console.log("An error occured when deleting the latest warning.");
          }
        }, 5000);
        return;
      }

      sentences.add(message.content, message.author.id);
      if (currentData.messageId !== "0") {
        const msg = await message.channel.messages.fetch(currentData.messageId);
        try {
          await msg.delete();
        } catch (err) {
          console.log("An error occured when deleting the latest message.");
        }
      }

      let msg = await message.channel.send({
        embeds: [
          {
            title: "Sätzebilden",
            fields: [
              {
                name: "Letzter Satz",
                value: sentences.get().lastMessage,
              },
              {
                name: "Letztes Wort",
                value: message.content,
              },
              {
                name: "Aktueller Satz",
                value: sentences.get().message,
              },
            ],
          },
        ],
      });
      sentences.updateMessageId(msg.id);
      return;
    }
  }, message.reply);
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (user.bot) return;
  if (reaction.message.channelId !== BEDWARS_IDEAS_CHANNEL_ID) return;

  const member = await reaction.message.guild.members.fetch(user.id);

  if (
    reaction.message.reactions.cache.some(
      (x) => x.emoji.name === "❌" && x.count > 1
    ) &&
    reaction.emoji.name === "❌"
  ) {
    reaction.message.reactions.cache
      .get(reaction.emoji.name)
      ?.users?.remove(user.id);
    return;
  }

  if (
    reaction.emoji.name === "❌" &&
    member.permissions.has("ManageMessages")
  ) {
    reaction.message.reactions.removeAll();
    reaction.message.react("❌");
  }

  if (reaction.emoji.name !== "🔼" && reaction.emoji.name !== "🔽") {
    reaction.message.reactions.cache
      .get(reaction.emoji.name)
      ?.users?.remove(user.id);
    return;
  }
});

const express = require("express");
const app = express();
app.use(express.json());
const port = 3000;

/**
 * This endpoint is used to notify the discord users that a player is looking for a game
 * The following arguments are provided:
 * - username: The username of the minecraft account
 * The following headers are provided:
 * - x-signature: The signature of the request
 */
app.post("/api/joinme", (req, res) => {
  const body = req.body;

  if (req.headers["x-signature"] !== process.env.SEVER_SIGNATURE) {
    res.status(403).send("Invalid signature");
    return;
  }

  client.guilds.fetch(COMMANDMC_GUILD_ID).then((guild) => {
    guild.channels.fetch(JOINME_CHANNEL_ID).then((channel) => {
      channel.send(
        `**${body.username}** möchte mit dir spielen! Joine jetzt auf Commandmc.eu!`
      );
    });
  });

  res.status(200).json({ status: "ok" });
});

/**
 * This endpoint is used to add a rank from a user
 * The following arguments are provided:
 * - uuid: The uuid of the minecraft account
 * - rank: The rank to add
 * The following headers are provided:
 * - x-signature: The signature of the request
 */
app.post("/api/rank", (req, res) => {
  const { uuid, rank } = req.body;

  if (req.headers["x-signature"] !== process.env.SEVER_SIGNATURE) {
    res.status(403).send("Invalid signature");
    return;
  }

  if (!uuid || !rank) {
    res.status(400).json({ error: "Missing uuid or rank" });
    return;
  }

  if (!possibleRanks.includes(rank)) {
    res.status(400).json({ error: "Invalid rank" });
    return;
  }

  const verification = verifications.completed.getByUuid(uuid);

  if (!verification) {
    res.status(404).json({ error: "Uuid not found" });
  }

  const [userId] = verification;

  client.guilds.fetch(COMMANDMC_GUILD_ID).then((guild) => {
    const discordRank = guild.roles.cache.find((role) => role.name === rank);

    guild.members.fetch(userId).then((member) => {
      member.roles.add(discordRank);
    });
  });

  res.status(200).json({ status: "ok" });
});

const possibleRanks = ["Champion", "Content"];

/**
 * This endpoint is used to remove a rank from a user
 * The following arguments are provided:
 * - uuid: The uuid of the minecraft account
 * The following headers are provided:
 * - x-signature: The signature of the request
 */
app.delete("/api/rank", (req, res) => {
  const { uuid } = req.body;

  if (req.headers["x-signature"] !== process.env.SEVER_SIGNATURE) {
    res.status(403).send("Invalid signature");
    return;
  }

  if (!uuid) {
    res.status(400).json({ error: "Missing uuid" });
    return;
  }

  const verification = verifications.completed.getByUuid(uuid);

  if (!verification) {
    res.status(404).json({ error: "Uuid not found" });
  }

  const [userId] = verification;

  client.guilds.fetch(COMMANDMC_GUILD_ID).then((guild) => {
    guild.members.fetch(userId).then((member) => {
      const memberRanks = member.roles.cache;
      memberRanks.forEach((rank) => {
        if (possibleRanks.includes(rank.name)) {
          member.roles.remove(rank);
        }
      });
    });
  });

  res.status(200).json({ status: "ok" });
});

/**
 * This endpoint is used to syncronize the minecraft account with the discord account
 * The following arguments are provided:
 * - token: The token that was sent to the user
 * - uuid: The uuid of the minecraft account
 * The following headers are provided:
 * - x-signature: The signature of the request
 */
app.post("/api/verify", (req, res) => {
  const { token, uuid } = req.body;

  if (req.headers["x-signature"] !== process.env.SEVER_SIGNATURE) {
    res.status(403).send("Invalid signature");
    return;
  }

  if (!token || !uuid) {
    res.status(400).json({ error: "Missing token or uuid" });
    return;
  }

  const verification = verifications.pending.getByToken(token);

  if (!verification || verification[1] !== token) {
    res.status(400).json({ error: "Invalid token" });
    return;
  }

  const [userId] = verification;

  verifications.pending.remove(userId);
  verifications.completed.add(userId, uuid);

  return res.status(200).json({ uuid, userId });
});

const getAllServerEmojis = async (guildId) => {
  const guild = await client.guilds.fetch(guildId);
  const emojis = await guild.emojis.fetch();

  return emojis.map((emoji) => ({
    name: emoji.name,
    url: emoji.url,
  }));
};

const request = require("request");

const download = (uri, filename) => {
  request.head(uri, (err, res, body) => {
    return new Promise((resolve, reject) => {
      request(uri)
        .pipe(fs.createWriteStream(filename))
        .on("close", resolve)
        .on("error", reject);
    });
  });
};

app.get("/api/emojis", async (_, res) => {
  return res.status(200).json(await getAllServerEmojis(COMMANDMC_GUILD_ID));
});

app.post("/api/emojis", async (req, res) => {
  const emojis = await getAllServerEmojis(COMMANDMC_GUILD_ID);

  if (req.headers["x-signature"] !== process.env.SEVER_SIGNATURE) {
    res.status(403).send("Invalid signature");
    return;
  }

  fs.rmSync(path.join(__dirname, "resourcepack"), {
    recursive: true,
    force: true,
  });

  const resourcepackPath = path.join(__dirname, "resourcepack");

  if (!fs.existsSync(resourcepackPath)) {
    fs.mkdirSync(resourcepackPath);
  }

  const packPath = path.join(resourcepackPath, "pack.mcmeta");

  if (!fs.existsSync(packPath)) {
    fs.writeFileSync(
      packPath,
      JSON.stringify({
        pack: {
          pack_format: 6,
          description: "Commandmc Emojis",
        },
      })
    );
  }

  const fontPath = path.join(resourcepackPath, "assets", "minecraft", "font");

  if (!fs.existsSync(fontPath)) {
    fs.mkdirSync(fontPath, { recursive: true });
  }

  const fontJsonPath = path.join(fontPath, "default.json");

  if (!fs.existsSync(fontJsonPath)) {
    fs.writeFileSync(
      fontJsonPath,
      JSON.stringify(
        {
          providers: emojis.map((emoji, index) => ({
            type: "bitmap",
            file: `minecraft:font/${emoji.name.toLowerCase()}.png`,
            ascent: 8,
            chars: [String.fromCharCode(0xe000 + index)],
          })),
        },
        null,
        4
      )
    );
  }

  const texturesPath = path.join(
    resourcepackPath,
    "assets",
    "minecraft",
    "textures",
    "font"
  );

  if (!fs.existsSync(texturesPath)) {
    fs.mkdirSync(texturesPath, { recursive: true });
  }

  await Promise.all(
    emojis.map((emoji) => {
      return download(
        emoji.url,
        path.join(
          resourcepackPath,
          "assets",
          "minecraft",
          "textures",
          "font",
          `${emoji.name.toLowerCase()}.png`
        )
      );
    })
  );

  res.status(200).json(
    emojis.map((emoji, index) => ({
      name: emoji.name,
      url: emoji.url,
      unicode: String.fromCharCode(0xe000 + index),
    }))
  );
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
