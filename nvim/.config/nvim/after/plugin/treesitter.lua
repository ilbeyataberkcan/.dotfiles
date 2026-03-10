vim.api.nvim_create_autocmd('User', {
    pattern = 'TSUpdate',
    callback = function ()
        local parsers = require("nvim-treesitter.parsers")

        parsers.cpp =  {
                install_info = {
                url = "https://github.com/taku25/tree-sitter-unreal-cpp",
                branch = "master",
            },
        }

        parsers.ushader = {
            install_info = {
                url = "https://github.com/taku25/tree-sitter-unreal-shader",
                branch = "master"
            },
            tier = 1
        }
    end
})

local languages = {
        "c",
        "cpp",
        "lua",
        "vim",
        "vimdoc",
        "query",
        "markdown",
        "markdown_inline",
        "c_sharp",
        "javascript",
        "typescript",
        "html",
        "bash",
        "json",
        "ushader"
}
require("nvim-treesitter").install(languages)

--   local group = vim.api.nvim_create_augroup('Treesitter', { clear = true })
--   vim.api.nvim_create_autocmd('FileType', {
--       group = group,
--       pattern = languages,
--       callback = function (args)
--           vim.treesitter.start(args.buf)
--           vim.bo[args.buf].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
--       end
--   })

