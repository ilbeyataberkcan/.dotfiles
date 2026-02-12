#!/usr/bin/env zsh

set -e

info () {
	printf "\r [\033[00;34m..\033[0m] %s\n" "$1"
}

user () {
	printf "\r [\033[00;33m??\033[0m] %s" "$1"
}

success () {
	printf "\r\033[2K [\033[00;32mOK\033[0m] %s\n" "$1"
}

fail () {
	printf "\r\033[2K [\033[00;31mFAIL\033[0m] %s\n" "$1"
	echo ''
	exit1
}

install_packages() {
	PACKAGES=(
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
	)

	for package in "${PACKAGES[@]}"; do
		if ! pacman -Q "$package" &>/dev/null; then
			info "Installing $package..."
			sudo pacman -S --noconfirm "$package"

		else
			success "$package is already installed."
		fi
	done

	success "All essential packages are installed."
}

stow_dotfiles() {
	STOW_FOLDERS=(zsh nvim tmux git ghostty bin hypr waybar pipewire wireplumber opencode)
	cd ~/.dotfiles
	for folder in "${STOW_FOLDERS[@]}"; do
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
	info "Performing post-installation tasks..."

	current_shell=$(getent passwd "$USER" | cut -d: -f7)
	zsh_path=$(which zsh)

	if [[ "$current_shell" != "$zsh_path" ]] ; then
		info "Changing default shell to Zsh..."
		if sudo chsh -s "$zsh_path" "$USER"; then
			success "Default shell changed to Zsh. Please log out and log back in for the changes to take effect."
		else
			fail "Could not change the default shell. Please try running 'chsh -s \$(which zsh)' manually." 
		fi
	else
		success "Default shell is already Zsh."
	fi
}

main () {
	REPO_ROOT=$(cd "$(dirname "$0")/../.." && pwd)
	cd "$REPO_ROOT"
	info "Operating from repository root: ${REPO_ROOT}"

	install_packages
	stow_dotfiles
	post_installation_tasks

	echo ""

	success "System setup is complete!"
	info "Please log out and log back in for all changes to take effect."
}

main "$@"
