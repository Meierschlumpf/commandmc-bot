const { SlashCommandBuilder } = require("discord.js");

const getServerEmbed = async (domain, title, description, version) => {
  const data = await fetch(`https://api.mcsrvstat.us/2/${domain}`).then((res) =>
    res.json()
  );

  const basicFields = [
    {
      name: "Domain",
      value: domain,
      inline: true,
    },
    {
      name: "Version",
      value: version,
      inline: true,
    },
    {
      name: "Status",
      value: data.online ? "Online" : "Offline",
      inline: false,
    },
  ];

  if (!data.online) {
    return {
      title,
      description,
      color: 0xff0000,
      fields: basicFields,
    };
  }

  return {
    title,
    description,
    color: 0x00ff00,
    fields: [
      ...basicFields,
      {
        name: "Spieler",
        value: `${data.players.online}/${data.players.max}`,
        inline: true,
      },
    ],
  };
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("servers")
    .setDescription("Gibt dir Informtionen zu unseren Servern"),
  async execute(interaction) {
    await interaction.deferReply({
      ephemeral: true,
    });

    try {
      interaction.editReply({
        content: "Hier sind unsere Server:",
        embeds: [
          await getServerEmbed(
            "commandmc.eu",
            "Bedwars",
            "Einfach Bedwars, aber besser. Wir haben die besten Aspekte der grossen Server genommen und zusammengesetzt. Zudem ist natürlich alles in der 1.19+, aber mit 1.8 PvP. Es gibt viele Extraitems und Möglichkeiten das Spiel ganz neu zu erleben. Dank unserem einzigartigen Maperstellungssystem hast du nun die Möglichkeit deine eigenen Maps zu erstellen und mit oder gegen Freunde zu spielen. ",
            "1.19+"
          ),
          await getServerEmbed(
            "sw.commandmc.eu",
            "Spightwars",
            "Eine Mischung aus Survival und Bedwars. Du spawnst auf einer Survivalmap bei deinem Bett und farmst in dieser deine Ausrüstung um dann bei epischen Kämpfen die Betten der anderen zu zerstören. Neben den normalen Survival-Aspekten gibt es noch ein paar Extras. Beispielseise kannst du durch Kupfer Netherite bekommen oder Blätter droppen zu einer bestimmten Wahrscheinlichkeit Goldäpfel.",
            "1.19.2"
          ),
          await getServerEmbed(
            "dev.commandmc.eu",
            "Dev Server",
            "Ganz kurz gesagt eine Neuentwicklung von Commandmc 3.0, unserem Minigameserver. Aktuell gibt es zwei Spielmodi, Smash und Safewalk, diese wurden aber um einiges erweitert. Andere Spielmodi werden folgen. Wie man aus dem Namen entnehmen kann, handelt es sich um eine nicht fertige Version. Es kann also sein, dass Feature auftreten.",
            "1.19.2"
          ),
        ],
      });
    } catch (error) {
      interaction.editReply({
        content:
          "Es ist ein Fehler aufgetreten. Die API ist aktuell nicht erreichbar.",
      });
    }
  },
};
