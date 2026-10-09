hl.config({
    input = {
        follow_mouse = 2,

        sensitivity   = 0, -- -1.0 - 1.0, 0 means no modification.
        accel_profile = "flat",

        touchpad = {
            disable_while_typing = true,
            natural_scroll       = true,
            scroll_factor        = 0.3,
            drag_3fg             = 1,
            clickfinger_behavior = true,
        },
    },
})

-- Per-device override. Check names with `hyprctl devices`.
hl.device({
    name        = "00-093a:0274-touchpad",
    sensitivity = 1.0,
})
