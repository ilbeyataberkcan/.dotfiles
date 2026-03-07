require("USH").setup {
    engine_path = "/Mergen/UnrealEngine",
    presets = {

        -- WITH EDITOR BUILDS

        { -- For daily development and playtesting
            name = "LinuxDevelopmentEditor",
            Platform = "Linux",
            IsEditor = true,
            Configuration = "Development"
        },

        { -- Debug game with editor AND the engine. 
            name = "LinuxDebugEditor",
            Platform = "Linux",
            IsEditor = true,
            Configuration = "Debug"
        },

        { -- Debug game with editor but the keep the engine code optimized
            name = "LinuxDebugGameEditor",
            Platform = "Linux",
            IsEditor = true,
            Configuration = "DebugGame"
        },


        -- STANDALONE BUILDS

        { -- Debug the only the game code without the editor and engine
            name = "LinuxDebugGame",
            Platform = "Linux",
            IsEditor = false,
            Configuration = "DebugGame"
        },

        { -- Debug the game code with engine but without editor
            name = "LinuxDebugGameWithEngine",
            Platform = "Linux",
            IsEditor = false,
            Configuration = "Debug"
        },

        { -- For playtesting without the editor overhead
            name = "LinuxDevelopment",
            Platform = "Linux",
            IsEditor = false,
            Configuration = "Development"
        },

        { -- Shipping 
            name = "LinuxShipping",
            Platform = "Linux",
            IsEditor = false,
            Configuration = "Shipping"
        }
    },

    preset_target = "LinuxDevelopmentEditor",
}
