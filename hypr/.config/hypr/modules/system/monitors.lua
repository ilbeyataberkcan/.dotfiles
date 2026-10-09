-- Later rules override the catch-all.
hl.monitor({ output = "",         mode = "preferred",       position = "auto-center-right", scale = "auto" })
hl.monitor({ output = "eDP-1",    mode = "2560x1440@165",   position = "0x0",               scale = 1 })
hl.monitor({ output = "HDMI-A-1", mode = "1920x1080@60",    position = "auto-center-right", scale = 1 })
hl.monitor({ output = "DP-1",     mode = "1920x1080@60",    position = "0x0",               scale = 1 })

hl.config({
    xwayland = {
        force_zero_scaling = true,
    },
})
