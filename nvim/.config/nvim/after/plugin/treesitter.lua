local function prepend_path(path)
    if not path or path == "" then
        return
    end

    if not vim.uv.fs_stat(path) then
        return
    end

    local current_path = vim.env.PATH or ""
    local wrapped_path = ":" .. current_path .. ":"
    local target = ":" .. path .. ":"
    if not wrapped_path:find(target, 1, true) then
        vim.env.PATH = path .. ":" .. current_path
    end
end

local function ensure_tree_sitter_cli()
    if vim.fn.executable("tree-sitter") == 1 then
        return
    end

    prepend_path(vim.fs.joinpath(vim.fn.expand("~"), ".cargo", "bin"))
end

local function configure_unreal_parsers()
    local parsers = require("nvim-treesitter.parsers")

    parsers.cpp = {
        install_info = {
            url = "https://github.com/taku25/tree-sitter-unreal-cpp",
            revision = "7bbb85f1fcc6e109c90cea2167e88a5a472910d3",
        },
    }

    parsers.ushader = {
        install_info = {
            url = "https://github.com/taku25/tree-sitter-unreal-shader",
            revision = "26f0617475bb5d5accb4d55bd4cc5facbca81bbd",
        },
        tier = 1,
    }
end

ensure_tree_sitter_cli()
configure_unreal_parsers()

vim.api.nvim_create_autocmd("User", {
    pattern = "TSUpdate",
    callback = configure_unreal_parsers,
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
    "ushader",
}

require("nvim-treesitter").install(languages)
