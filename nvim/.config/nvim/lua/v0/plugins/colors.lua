return {
    "scottmckendry/cyberdream.nvim",
    name = "cyberdream",
    lazy = false,
    priority = 1000,
    config = function()
        require("cyberdream").setup({
            transparent = true,
            saturation = 0.72,
            italic_comments = false,
            borderless_pickers = false,
            hide_fillchars = true,
        })

        vim.cmd("colorscheme cyberdream")

        -- Extra UI cleanup for transparency
        vim.api.nvim_set_hl(0, "SignColumn", { bg = "NONE" })
        vim.api.nvim_set_hl(0, "FoldColumn", { bg = "NONE" })
        vim.api.nvim_set_hl(0, "EndOfBuffer", { fg = "#14110f", bg = "NONE" })

    end,
}
