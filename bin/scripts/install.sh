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

    info "paru is required before installing packages."
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

install_package() {
    local package=$1

    if pacman -Q "$package" >/dev/null 2>&1; then
        success "$package is already installed."
        return
    fi

    if pacman -Si "$package" >/dev/null 2>&1; then
        info "Installing official package '$package'..."
        sudo pacman -S --needed "$package"
        return
    fi

    if paru -Si "$package" >/dev/null 2>&1; then
        info "Installing AUR package '$package'..."
        paru -S --needed "$package"
        return
    fi

    fail "Package '$package' was not found in pacman or the AUR."
}

install_packages() {
    local package
    local packages=(
        stow
        neovim
        tmux
        zsh
        zsh-completions
        ghostty
        waybar
        wireplumber
        pipewire
        pipewire-pulse
        systemd
        carla
    )

    ensure_paru

    for package in "${packages[@]}"; do
        install_package "$package"
    done

    success "All essential packages are installed."
}

prepare_managed_path() {
    local package=$1
    local relative_target=$2
    local source_path="${REPO_ROOT}/${package}/${relative_target}"
    local target_path="${HOME}/${relative_target}"

    if [ -L "$target_path" ] || [ ! -e "$target_path" ]; then
        return
    fi

    if [ -d "$target_path" ]; then
        if rmdir "$target_path" 2>/dev/null; then
            info "Removed empty '$target_path' so stow can manage it."
            return
        fi

        if [ -d "$source_path" ] && diff -qr "$source_path" "$target_path" >/dev/null 2>&1; then
            info "Replacing '$target_path' with a stow-managed symlink."
            rm -rf "$target_path"
            return
        fi
    fi

    fail "'$target_path' already exists and is not stow-managed. Resolve it before running install.sh."
}

stow_dotfiles() {
    local folder
    local stow_folders=(
        zsh
        nvim
        tmux
        git
        ghostty
        bin
        hypr
        waybar
        pipewire
        wireplumber
        gsd
        gsd-workspaces
        opencode
        systemd
        carla
    )

    prepare_managed_path "gsd" ".gsd"
    prepare_managed_path "gsd-workspaces" "gsd-workspaces"

    cd "$REPO_ROOT"
    for folder in "${stow_folders[@]}"; do
        if [ -d "$folder" ]; then
            info "Stowing '$folder' package..."
            stow --restow "$folder"
        else
            info "Skipping '$folder', directory not found."
        fi
    done

    success "Dotfiles have been stowed successfully."
}

post_installation_tasks() {
    local current_shell
    local zsh_path

    info "Performing post-installation tasks..."

    current_shell=$(getent passwd "$USER" | cut -d: -f7)
    zsh_path=$(command -v zsh)

    if [[ "$current_shell" != "$zsh_path" ]]; then
        info "Changing default shell to Zsh..."
        if sudo chsh -s "$zsh_path" "$USER"; then
            success "Default shell changed to Zsh. Please log out and log back in for the changes to take effect."
        else
            fail "Could not change the default shell. Please try running 'chsh -s \$(command -v zsh)' manually."
        fi
    else
        success "Default shell is already Zsh."
    fi
}

main() {
    REPO_ROOT=$(cd "$(dirname "$0")/../.." && pwd)
    cd "$REPO_ROOT"
    info "Operating from repository root: ${REPO_ROOT}"

    install_packages
    stow_dotfiles
    post_installation_tasks

    printf "\n"

    success "System setup is complete!"
    info "Please log out and log back in for all changes to take effect."
}

main "$@"
