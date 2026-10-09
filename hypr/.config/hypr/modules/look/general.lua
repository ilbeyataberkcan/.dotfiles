hl.config({
    general = {
        gaps_in  = 5,
        gaps_out = 5,

        border_size = 2,

        col = {
            active_border   = { colors = { "rgba(33ccffee)", "rgba(00ff99ee)" }, angle = 45 },
            inactive_border = "rgba(595959aa)",
        },

        -- Resize windows by dragging borders and gaps
        resize_on_border = false,

        -- See https://wiki.hypr.land/Configuring/Advanced-and-Cool/Tearing/ before enabling
        allow_tearing = false,

        layout = "dwindle",
    },

    dwindle = {
        preserve_split = true,
    },

    master = {
        new_status = "master",
    },

    misc = {
        force_default_wallpaper = -1,    -- 0 or 1 disables the anime mascot wallpapers
        disable_hyprland_logo   = false, -- true disables the random Hyprland logo background
    },
})
