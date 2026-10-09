-- A single tiled window (w[tv1]) or a maximized window (f[1]) gets no gaps, borders or rounding.
-- Disable the feature by removing its require in hyprland.lua.
hl.workspace_rule({ workspace = "w[tv1]", gaps_out = 0, gaps_in = 0 })
hl.workspace_rule({ workspace = "f[1]",   gaps_out = 0, gaps_in = 0 })

hl.window_rule({
    name  = "smart-gaps-monocle",
    match = { float = false, workspace = "w[tv1]" },

    border_size = 0,
    rounding    = 0,
})

hl.window_rule({
    name  = "smart-gaps-maximized",
    match = { float = false, workspace = "f[1]" },

    border_size = 0,
    rounding    = 0,
})
