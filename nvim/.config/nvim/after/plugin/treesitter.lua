local treesitter = require("nvim-treesitter")

local languages = {
    -- C / C++
    "c",
    "cpp",
    "make",
    "cmake",
    -- Go
    "go",
    "gomod",
    "gosum",
    "gowork",
    -- Rust
    "rust",
    -- Python
    "python",
    -- Web
    "html",
    "css",
    "javascript",
    "typescript",
    "tsx",
    "jsdoc",
    "json",
    -- Markdown
    "markdown",
    "markdown_inline",
    -- Neovim / tooling
    "lua",
    "luadoc",
    "vim",
    "vimdoc",
    "query",
    "bash",
    "regex",
    "diff",
    "gitcommit",
    "toml",
    "yaml",
}

-- Parsers are compiled locally and need tree-sitter-cli from the system package manager.
if vim.fn.executable("tree-sitter") == 1 then
    treesitter.install(languages)
else
    vim.notify("tree-sitter CLI not found; install it with: pacman -S tree-sitter-cli", vim.log.levels.WARN)
end

-- Highlighting is opt-in on the main branch; filetypes without a parser keep regex syntax.
vim.api.nvim_create_autocmd("FileType", {
    group = vim.api.nvim_create_augroup("v0_treesitter", { clear = true }),
    callback = function(args)
        pcall(vim.treesitter.start, args.buf)
    end,
})
