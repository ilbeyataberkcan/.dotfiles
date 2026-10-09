-- Hyprland entrypoint. Each module owns one concern; see modules/.
-- Order matters: env before autostart, autostart last.

require("modules.system.env")
require("modules.system.monitors")

require("modules.input.keyboard")
require("modules.input.pointer")

require("modules.look.general")
require("modules.look.decoration")
require("modules.look.animations")

require("modules.binds.launchers")
require("modules.binds.windows")
require("modules.binds.workspaces")
require("modules.binds.media")

require("modules.rules.windows")
require("modules.rules.smart-gaps")

require("modules.system.autostart")
