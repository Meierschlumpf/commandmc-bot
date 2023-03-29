const { SlashCommandBuilder } = require("discord.js");
const { randomBytes } = require("node:crypto");
const { verifications } = require("../helpers.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verbinde dein Minecraft Konto mit deinem Discord Konto."),
  async execute(interaction) {
    const user = interaction.user;
    const pending = verifications.pending.getByUserId(user.id);

    if (pending) {
      return await interaction.reply({
        content:
          "Du kannst dein Konto mit dem Befehl `/verify " +
          pending[1] +
          "` auf dem Minecraft Server verbinden.",
        ephemeral: true,
      });
    }

    const token = randomBytes(16).toString("hex");

    verifications.pending.add(user.id, token);

    await interaction.reply({
      content:
        "Du kannst dein Konto mit dem Befehl `/verify " +
        token +
        "` auf dem Minecraft Server verbinden.",
      ephemeral: true,
    });
  },
};
