function ColorMyPencils(color)
	color = color
	vim.cmd.colorscheme(color)

    vim.api.nvim_set_hl(0, "WinSeparator", { fg = "#56627a", bg = "NONE" })
    vim.api.nvim_set_hl(0, "EndOfBuffer", { fg = "#10151f", bg = "NONE" })
    vim.api.nvim_set_hl(0, "SignColumn", { bg = "NONE" })
    vim.api.nvim_set_hl(0, "FoldColumn", { bg = "NONE" })
end


-- ColorMyPencils("cyberdream")
