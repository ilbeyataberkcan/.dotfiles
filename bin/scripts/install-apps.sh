#!/usr/bin/env zsh

set -euo pipefail

info() {
    printf "\r [\033[00;34m..\033[0m] %s\n" "$1"
}

user() {
    printf "\r [\033[00;33m??\033[0m] %s" "$1"
}

success() {
    printf "\r\033[2K [\033[00;32mOK\033[0m] %s\n" "$1"
}

fail() {
    printf "\r\033[2K [\033[00;31mFAIL\033[0m] %s\n" "$1"
    printf "\n"
    exit 1
}

prompt_yes_no() {
    local prompt=$1
    local reply

    user "$prompt [y/N] "
    read -r reply

    case "$reply" in
        [yY]|[yY][eE][sS])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

ensure_paru() {
    local temp_dir

    if command -v paru >/dev/null 2>&1; then
        success "paru is already installed."
        return
    fi

    info "paru is required before installing AUR packages."
    if ! prompt_yes_no "paru is not installed. Install it now?"; then
        fail "Cannot continue without paru."
    fi

    info "Installing prerequisites for paru..."
    sudo pacman -S --needed base-devel git

    temp_dir=$(mktemp -d)

    info "Cloning paru build files..."
    git clone https://aur.archlinux.org/paru.git "$temp_dir/paru"

    info "Building and installing paru..."
    (
        cd "$temp_dir/paru"
        makepkg -si
    )

    rm -rf "$temp_dir"

    if ! command -v paru >/dev/null 2>&1; then
        fail "paru installation did not complete successfully."
    fi

    success "paru has been installed."
}

ensure_flatpak() {
    if pacman -Q flatpak >/dev/null 2>&1; then
        success "flatpak is already installed."
        return
    fi

    info "Installing official package 'flatpak'..."
    sudo pacman -S --needed flatpak
}

install_pacman_package() {
    local package=$1

    if pacman -Q "$package" >/dev/null 2>&1; then
        success "$package is already installed."
        return
    fi

    info "Installing official package '$package'..."
    sudo pacman -S --needed "$package"
}

install_aur_package() {
    local package=$1

    if pacman -Q "$package" >/dev/null 2>&1; then
        success "$package is already installed."
        return
    fi

    if ! paru -Si "$package" >/dev/null 2>&1; then
        fail "AUR package '$package' was not found."
    fi

    info "Installing AUR package '$package'..."
    paru -S --needed "$package"
}

ensure_flathub() {
    if flatpak remote-list --columns=name | grep -qx 'flathub'; then
        success "Flathub remote is already configured."
        return
    fi

    info "Adding Flathub remote..."
    flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
    success "Flathub remote has been added."
}

install_flatpak_app() {
    local app_id=$1

    if flatpak info "$app_id" >/dev/null 2>&1; then
        success "Flatpak app '$app_id' is already installed."
        return
    fi

    info "Installing Flatpak app '$app_id'..."
    flatpak install -y flathub "$app_id"
}

install_pacman_packages() {
    local package
    local packages=(
        bitwarden
        carla
        gamemode
        gamescope
        ghostty
        hyprland
        hyprlauncher
        lib32-gamemode
        lib32-mangohud
        mangohud
        neovim
        pipewire
        pipewire-pulse
        steam
        steam-devices
        tmux
        waybar
        wireplumber
        zsh
        zsh-completions
    )

    for package in "${packages[@]}"; do
        install_pacman_package "$package"
    done
}

install_aur_packages() {
    local package
    local packages=(
        piavpn-bin
        zen-browser-bin
    )

    for package in "${packages[@]}"; do
        install_aur_package "$package"
    done
}

install_flatpak_apps() {
    local app_id
    local apps=(
        com.heroicgameslauncher.hgl
    )

    ensure_flathub

    for app_id in "${apps[@]}"; do
        install_flatpak_app "$app_id"
    done
}

maybe_stow_dotfiles() {
    local repo_root=$1
    local install_script="$repo_root/bin/scripts/install.sh"

    if ! prompt_yes_no "Do you want to stow the configuration files now?"; then
        info "Skipping dotfile stow. Run bin/scripts/install.sh later when you are ready."
        return
    fi

    if [ ! -f "$install_script" ]; then
        fail "Could not find '$install_script'."
    fi

    info "Running install.sh in stow-only mode..."
    zsh "$install_script" --skip-packages
}

main() {
    local repo_root

    repo_root=$(cd "$(dirname "$0")/../.." && pwd)

    info "Installing workstation applications..."

    ensure_paru
    ensure_flatpak
    install_pacman_packages
    install_aur_packages
    install_flatpak_apps
    maybe_stow_dotfiles "$repo_root"

    printf "\n"

    success "Application installation is complete!"
}

main "$@"
