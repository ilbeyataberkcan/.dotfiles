local apps = require("modules.apps")
local mod = apps.mainMod

local waybar_control = "$HOME/scripts/waybar/control.sh"

hl.bind(mod .. " + Q", hl.dsp.exec_cmd(apps.terminal))
hl.bind(mod .. " + E", hl.dsp.exec_cmd(apps.fileManager))
hl.bind(mod .. " + R", hl.dsp.exec_cmd(apps.menu))
hl.bind(mod .. " + B", hl.dsp.exec_cmd(apps.browser))

-- Waybar popups
hl.bind(mod .. " + F9",  hl.dsp.exec_cmd(waybar_control .. " system-resources toggle"))
hl.bind(mod .. " + F10", hl.dsp.exec_cmd(waybar_control .. " tray-actions toggle"))
hl.bind(mod .. " + F11", hl.dsp.exec_cmd("WAYBAR_POPUP_MS=900 " .. waybar_control .. " datetime-quick peek"))
hl.bind(mod .. " + F12", hl.dsp.exec_cmd(waybar_control .. " workspace-popup peek"))

hl.bind(mod .. " + SHIFT + L", hl.dsp.exec_cmd("hyprlock -q --grace 3 --immediate-render"))

-- Clipboard history
-- hl.bind(mod .. " + V", hl.dsp.exec_cmd("cliphist list | wofi --dmenu --pre-display-cmd \"echo '%s' | cut -f 2\" | cliphist decode | wl-copy"))

-- Screenshots (clipboard only)
hl.bind(mod .. " + Print",         hl.dsp.exec_cmd("hyprshot -m window --clipboard-only")) -- window
hl.bind("Print",                   hl.dsp.exec_cmd("hyprshot -m output --clipboard-only")) -- monitor
hl.bind(mod .. " + SHIFT + P",     hl.dsp.exec_cmd("hyprshot -m region --clipboard-only")) -- region

-- T3 Code window capture (global shortcut)
hl.bind("CTRL + SHIFT + 2", hl.dsp.global("com.t3tools.T3Code:capture-window"))
