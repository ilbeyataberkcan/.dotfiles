-- Environment inherited by everything Hyprland launches.
-- Must load before system.autostart.

hl.env("XCURSOR_SIZE", "16")
hl.env("HYPRCURSOR_SIZE", "16")

-- GPU: NVIDIA primary (card1), fallback card0
hl.env("AQ_DRM_DEVICES", "/dev/dri/card1:/dev/dri/card0")
hl.env("LIBVA_DRIVER_NAME", "nvidia")
hl.env("__GLX_VENDOR_LIBRARY_NAME", "nvidia")
hl.env("GBM_BACKEND", "nvidia-drm")
hl.env("NVD_BACKEND", "direct")

hl.env("ELECTRON_OZONE_PLATFORM_HINT", "auto")
