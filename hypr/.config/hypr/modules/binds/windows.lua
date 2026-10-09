local mod = require("modules.apps").mainMod

hl.bind(mod .. " + C",           hl.dsp.window.close())
hl.bind(mod .. " + SHIFT + M",   hl.dsp.exit())
hl.bind(mod .. " + SHIFT + F",   hl.dsp.window.float({ action = "toggle" }))
hl.bind(mod .. " + P",           hl.dsp.window.pseudo()) -- dwindle
hl.bind("CTRL + F11",            hl.dsp.window.fullscreen({ mode = "maximized" }))

-- Move focus (vim keys)
hl.bind(mod .. " + H", hl.dsp.focus({ direction = "left" }))
hl.bind(mod .. " + L", hl.dsp.focus({ direction = "right" }))
hl.bind(mod .. " + K", hl.dsp.focus({ direction = "up" }))
hl.bind(mod .. " + J", hl.dsp.focus({ direction = "down" }))

-- Move/resize windows with mod + LMB/RMB and dragging
hl.bind(mod .. " + mouse:272", hl.dsp.window.drag(),   { mouse = true })
hl.bind(mod .. " + mouse:273", hl.dsp.window.resize(), { mouse = true })
