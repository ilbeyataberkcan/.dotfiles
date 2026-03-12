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
                orange = "#d6a665",
                yellow = "#d6a665",
                pink = "#a895a5",
            },
            overrides = function(colors)
                return {
                    ["Type"] = { fg = colors.cyan },
                    ["@type"] = { fg = colors.cyan },
                    ["@type.builtin"] = { fg = colors.cyan },
                    ["@keyword.type"] = { fg = colors.cyan },
                    ["@type.qualifier"] = { fg = colors.cyan },
                    ["@type.definition"] = { fg = colors.cyan },
                    ["@lsp.type.type"] = { fg = colors.cyan },
                    ["@lsp.type.class"] = { fg = colors.cyan },
                    ["@lsp.type.enum"] = { fg = colors.cyan },
                    ["@lsp.type.builtinType"] = { fg = colors.cyan },
                    ["@lsp.type.typeAlias"] = { fg = colors.cyan },

                    ["Function"] = { fg = colors.orange },
                    ["@function"] = { fg = colors.orange },
                    ["@function.call"] = { fg = colors.orange },
                    ["@function.method"] = { fg = colors.orange },
                    ["@method"] = { fg = colors.orange },
                    ["@method.call"] = { fg = colors.orange },
                    ["@constructor"] = { fg = colors.orange },
                    ["@lsp.type.function"] = { fg = colors.orange },
                    ["@lsp.type.method"] = { fg = colors.orange },

                    ["Identifier"] = { fg = colors.blue },
                    ["@variable"] = { fg = colors.blue },
                    ["@variable.parameter"] = { fg = colors.blue },
                    ["@variable.member"] = { fg = colors.blue },
                    ["@property"] = { fg = colors.blue },
                    ["@lsp.type.variable"] = { fg = colors.blue },
                    ["@lsp.type.property"] = { fg = colors.blue },
                    ["@lsp.type.parameter"] = { fg = colors.blue },

                    ["Macro"] = { fg = colors.red },
                    ["@macro"] = { fg = colors.red },
                    ["@function.macro"] = { fg = colors.red },
                    ["@constant.macro"] = { fg = colors.red },
                    ["@lsp.type.macro"] = { fg = colors.red },

                    ["Keyword"] = { fg = colors.magenta },
                    ["@keyword"] = { fg = colors.magenta },
                    ["@keyword.modifier"] = { fg = colors.magenta },
                    ["@keyword.return"] = { fg = colors.magenta },
                    ["@keyword.function"] = { fg = colors.magenta },
                    ["@keyword.coroutine"] = { fg = colors.magenta },
                    ["@keyword.operator"] = { fg = colors.magenta },

                    ["String"] = { fg = colors.green },
                    ["@string"] = { fg = colors.green },
                    ["@number"] = { fg = colors.green },
                    ["@float"] = { fg = colors.green },
                    ["@boolean"] = { fg = colors.magenta },

                    ["Comment"] = { fg = colors.grey, italic = true },
                    ["@comment"] = { fg = colors.grey, italic = true },

                    ["Operator"] = { fg = colors.fg },
                    ["@operator"] = { fg = colors.fg },
                    ["@punctuation"] = { fg = colors.fg },
                    ["@punctuation.bracket"] = { fg = colors.fg },
                    ["@punctuation.delimiter"] = { fg = colors.fg },

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
