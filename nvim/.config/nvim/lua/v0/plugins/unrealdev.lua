return {
  {
    "taku25/UnrealDev.nvim",
    cmd = { "UDEV" },
    dependencies = {
      "j-hui/fidget.nvim",
      "nvim-telescope/telescope.nvim",
      {
        "taku25/UNL.nvim",
        lazy = false,
        build = "cargo build --release --manifest-path scanner/Cargo.toml",
      },
      "taku25/UEP.nvim",
      "taku25/UEA.nvim",
      "taku25/UCM.nvim",
      "taku25/ULG.nvim",
      "taku25/USH.nvim",
      "taku25/USX.nvim",
      { "nvim-treesitter/nvim-treesitter", branch = "main" },
    },
    opts = {
      setup_modules = {
        UEP = true,
        UEA = true,
        UCM = true,
        ULG = true,
        USH = true,
        UBT = false, -- configured by its own spec below
      },
    },
    config = function(_, opts)
      require("UnrealDev").setup(opts)
    end,
  },

  {
    "taku25/UBT.nvim",
    cmd = { "UBT" },
    dependencies = {
      "taku25/UNL.nvim",
      "j-hui/fidget.nvim",
      "nvim-telescope/telescope.nvim",
    },
    opts = {
      engine_path = "/Mergen/UnrealEngine",
      presets = {
        { name = "LinuxDevelopmentEditor", Platform = "Linux", IsEditor = true, Configuration = "Development" },
        { name = "LinuxDebugEditor", Platform = "Linux", IsEditor = true, Configuration = "Debug" },
        { name = "LinuxDebugGameEditor", Platform = "Linux", IsEditor = true, Configuration = "DebugGame" },
        { name = "LinuxDebugGame", Platform = "Linux", IsEditor = false, Configuration = "DebugGame" },
        { name = "LinuxDebugGameWithEngine", Platform = "Linux", IsEditor = false, Configuration = "Debug" },
        { name = "LinuxDevelopment", Platform = "Linux", IsEditor = false, Configuration = "Development" },
        { name = "LinuxShipping", Platform = "Linux", IsEditor = false, Configuration = "Shipping" },
      },
      preset_target = "LinuxDevelopmentEditor",
      progress_file_name = "ubt-progress.log",
    },
  },
}
