local apps = require("modules.apps")

hl.on("hyprland.start", function()
    -- Register the Wayland session with user systemd so desktop portals can start.
    hl.exec_cmd("dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP XDG_SESSION_TYPE DISPLAY HYPRLAND_INSTANCE_SIGNATURE")
    hl.exec_cmd("systemctl --user import-environment WAYLAND_DISPLAY XDG_CURRENT_DESKTOP XDG_SESSION_TYPE DISPLAY HYPRLAND_INSTANCE_SIGNATURE")
    hl.exec_cmd("systemctl --user start hyprland-session.target")

    hl.exec_cmd("$HOME/scripts/waybar/launch.sh")
    hl.exec_cmd("systemctl --user start hyprpolkitagent")
    hl.exec_cmd(apps.terminal)
    hl.exec_cmd("bitwarden-desktop")

    -- Clipboard history
    hl.exec_cmd("wl-paste --type text --watch cliphist store")  -- text only
    hl.exec_cmd("wl-paste --type image --watch cliphist store") -- images only
end)
