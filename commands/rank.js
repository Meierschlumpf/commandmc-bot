const { SlashCommandBuilder } = require("discord.js");
const ranks = ["Player", "Champion", "Content"];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Vergebe einen Rang.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Der Spieler, dem du einen Rang geben möchtest.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("rank")
        .setDescription("Der Rang, den du vergeben möchtest.")
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("duration")
        .setDescription(
          "Die Dauer, für die der Rang vergeben werden soll in Tagen."
        )
    ),
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();

    const filtered = ranks
      .filter((player) =>
        player.toLowerCase().includes(focusedValue.toLowerCase())
      )
      .sort(
        (a, b) =>
          a.toLowerCase().indexOf(focusedValue.toLowerCase()) -
          b.toLowerCase().indexOf(focusedValue.toLowerCase())
      );

    await interaction.respond(
      filtered.map((choice) => ({
        name: choice,
        value: choice,
      }))
    );
  },
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const rank = interaction.options.getString("rank");
    if (!ranks.includes(rank)) {
      await interaction.reply({
        content: "Dieser Rang existiert nicht.",
        ephemeral: true,
      });
      return;
    }
    const duration = interaction.options.getInteger("duration");

    if (duration) {
      executeCommand(`rank set Meierschlumpf ${rank} ${duration}`);
      await interaction.reply({
        content: `Du hast den ${rank}-Rang für ` + duration + " Tage vergeben.",
        ephemeral: true,
      });
      return;
    }

    executeCommand(`rank set Meierschlumpf ${rank}`);
    await interaction.reply({
      content: `Du hast den ${rank}-Rang für unendlich Tage vergeben.`,
      ephemeral: true,
    });
  },
};

const executeCommand = (command) => {
  console.log("Executing command: " + command);
  exec("screen -r minigame -X stuff '" + command + "'^M");
};
