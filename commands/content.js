const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("content")
    .setDescription("Teile Content mit der Community")
    .addStringOption((option) =>
      option.setName("link").setDescription("Der Link zu deinem Content")
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("Eine kurze Beschreibung deines Content")
    ),
  async execute(interaction) {
    interaction.reply({
      content: "Dein Content wurde erfolgreich gepostet!",
      ephemeral: true,
    });

    const link = interaction.options.getString("link");
    const description = interaction.options.getString("description");

    interaction.client.channels.cache.get("644988623652913152").send({
      embeds: [
        {
          title: "Neuer Content",
          description: description,
          color: 0x00ff00,
          fields: [
            {
              name: "Link",
              value: link,
              inline: true,
            },
          ],
          footer: {
            text: "Gepostet von " + interaction.user.tag,
            icon_url: interaction.user.displayAvatarURL(),
          },
        },
      ],
    });
  },
};
