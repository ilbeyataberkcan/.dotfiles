local mod = require("modules.apps").mainMod

-- mod + [0-9] switches workspace, mod + SHIFT + [0-9] moves the active window there.
for i = 1, 10 do
    local key = i % 10 -- workspace 10 is on key 0
    hl.bind(mod .. " + " .. key,           hl.dsp.focus({ workspace = i }))
    hl.bind(mod .. " + SHIFT + " .. key,   hl.dsp.window.move({ workspace = i, follow = true }))
end

-- Scratchpad
hl.bind(mod .. " + S",         hl.dsp.workspace.toggle_special("magic"))
hl.bind(mod .. " + SHIFT + S", hl.dsp.window.move({ workspace = "special:magic", follow = true }))
