return {
    "scottmckendry/cyberdream.nvim",
    name = "cyberdream",
    lazy = false,
    priority = 1000,
    config = function()
        require("cyberdream").setup({
            transparent = true,
            saturation = 1,
            italic_comments = false,
            borderless_pickers = false,
            hide_fillchars = true,
            colors = {
                    fg = "#e6e9ef",
                    bg = "#000000",
                    grey = "#7b8496",
                    blue = "#82a5c9",
                    green = "#95b386",
                    magenta = "#a895a5",
                    red = "#d17b7b",
                    cyan = "#6ba69f",
                    orange = "#bf8f5a",
                    yellow = "#a4a9d6",
                    pink = "#a895a5",
                },
                overrides = function(colors)
                    return {
                        ["@type.definition"] = { fg = colors.orange },
                        ["@lsp.type.type"] = { fg = colors.orange },
                        ["@lsp.type.class"] = { fg = colors.orange },
                        ["@lsp.type.enum"] = { fg = colors.orange },
                        ["@lsp.type.struct"] = { fg = colors.orange },
                        ["@lsp.type.typeAlias"] = { fg = colors.orange },

                        ["Type"] = { fg = colors.cyan },
                        ["@type"] = { fg = colors.cyan },
                        ["@type.builtin"] = { fg = colors.cyan },
                        ["@lsp.type.builtinType"] = { fg = colors.cyan },

                        -- Structural Keywords (class, struct, enum) -> Cyan/Pine
                        ["Structure"] = { fg = colors.cyan },
                        ["StorageClass"] = { fg = colors.cyan },
                        ["Typedef"] = { fg = colors.cyan },
                        ["@structure"] = { fg = colors.cyan },
                        ["@storageclass"] = { fg = colors.cyan },
                        ["@keyword.type"] = { fg = colors.cyan },
                        ["@keyword.storage"] = { fg = colors.cyan },

                        -- Functions (Orange/Amber)
                        ["Function"] = { fg = colors.yellow },
                        ["@function"] = { fg = colors.yellow },
                        ["@function.call"] = { fg = colors.yellow },
                        ["@function.method"] = { fg = colors.yellow },
                        ["@method"] = { fg = colors.yellow },
                        ["@method.call"] = { fg = colors.yellow },
                        ["@constructor"] = { fg = colors.yellow },
                        ["@lsp.type.function"] = { fg = colors.yellow },
                        ["@lsp.type.method"] = { fg = colors.yellow },

                        -- Variables (Blue/Frost)
                        ["Identifier"] = { fg = colors.blue },
                        ["@variable"] = { fg = colors.blue },
                        ["@variable.parameter"] = { fg = colors.blue },
                        ["@variable.member"] = { fg = colors.blue },
                        ["@property"] = { fg = colors.blue },
                        ["@lsp.type.variable"] = { fg = colors.blue },
                        ["@lsp.type.property"] = { fg = colors.blue },
                        ["@lsp.type.parameter"] = { fg = colors.blue },

                        -- Macros (Red/Coral)
                        ["Macro"] = { fg = colors.red },
                        ["@macro"] = { fg = colors.red },
                        ["@function.macro"] = { fg = colors.red },
                        ["@constant.macro"] = { fg = colors.red },
                        ["@lsp.type.macro"] = { fg = colors.red },

                        -- Keywords and Modifiers (Magenta/Mauve)
                        ["Keyword"] = { fg = colors.magenta },
                        ["@keyword"] = { fg = colors.magenta },
                        ["@type.qualifier"] = { fg = colors.magenta }, -- const, static, etc.
                        ["@keyword.modifier"] = { fg = colors.magenta },
                        ["@keyword.return"] = { fg = colors.magenta },
                        ["@keyword.function"] = { fg = colors.magenta },
                        ["@keyword.coroutine"] = { fg = colors.magenta },
                        ["@keyword.operator"] = { fg = colors.magenta },

                        -- Literals (Green)
                        ["String"] = { fg = colors.green },
                        ["@string"] = { fg = colors.green },
                        ["@number"] = { fg = colors.green },
                        ["@float"] = { fg = colors.green },
                        ["@boolean"] = { fg = colors.magenta },

                        -- Comments (Grey)
                        ["Comment"] = { fg = colors.grey, italic = true },
                        ["@comment"] = { fg = colors.grey, italic = true },

                        -- Punctuation (White/Foreground)
                        ["Operator"] = { fg = colors.fg },
                        ["@operator"] = { fg = colors.fg },
                        ["@punctuation"] = { fg = colors.fg },
                        ["@punctuation.bracket"] = { fg = colors.fg },
                        ["@punctuation.delimiter"] = { fg = colors.fg },

                        -- UI Elements
                        ["Directory"] = { fg = colors.blue, bold = true },
                    }
                end,
        })

        vim.cmd("colorscheme cyberdream")

        -- Extra UI cleanup for transparency
        vim.api.nvim_set_hl(0, "SignColumn", { bg = "NONE" })
        vim.api.nvim_set_hl(0, "FoldColumn", { bg = "NONE" })
        vim.api.nvim_set_hl(0, "EndOfBuffer", { fg = "#14110f", bg = "NONE" })

    end,
}
