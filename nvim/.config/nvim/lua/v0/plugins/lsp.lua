-- Linters and formatters that are not language servers (used by nvim-lint and conform).
local TOOLS = {
    "golangci-lint",
    "markdownlint-cli2",
    "htmlhint",
    "prettierd",
}

return {
    {
        "neovim/nvim-lspconfig",
        dependencies = {
            { 'mason-org/mason.nvim', opts = {} },
            'mason-org/mason-lspconfig.nvim',
            -- blink.cmp registers its completion capabilities for every server via vim.lsp.config("*")
            'saghen/blink.cmp',
            {
                "folke/lazydev.nvim",
                ft = "lua",
                opts = {
                    library = {
                        { path = "${3rd}/luv/library", words = { "vim%.uv" } },
                    }
                }
            }
        },

        config = function()
            -- Installed servers are enabled automatically; overrides live in after/plugin/lsp.lua.
            require('mason-lspconfig').setup {
                ensure_installed = {
                    "clangd",        -- C / C++ (clang-tidy runs inside clangd)
                    "gopls",         -- Go
                    "rust_analyzer", -- Rust (clippy + rustfmt from the system toolchain)
                    "basedpyright",  -- Python types
                    "ruff",          -- Python lint + format
                    "ts_ls",         -- TypeScript < 7 (TS 7+ uses the project's native tsc, see after/plugin/lsp.lua)
                    "eslint",        -- TypeScript / JavaScript lint
                    "html",
                    "cssls",
                    "marksman",      -- Markdown
                    "lua_ls",
                },
            }

            local registry = require("mason-registry")
            registry.refresh(function()
                for _, name in ipairs(TOOLS) do
                    local pkg = registry.get_package(name)
                    if not pkg:is_installed() and not pkg:is_installing() then
                        pkg:install()
                    end
                end
            end)
        end
    }
}
