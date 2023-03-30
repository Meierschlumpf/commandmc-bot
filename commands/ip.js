const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ip")
    .setDescription("Erhalte die IP vom Minecraft Server."),
  async execute(interaction) {
    await interaction.reply({
      content: "Die IP lautet: commandmc.eu",
      ephemeral: true,
    });
  },
};
