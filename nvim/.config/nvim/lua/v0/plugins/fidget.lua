return {
    "j-hui/fidget.nvim",
    lazy = false,
    opts = {
        notification = {
            -- Route every vim.notify() (keymaps, plugins) to the bottom-right corner
            override_vim_notify = true,
        },
    },
}
