return {
    "stevearc/conform.nvim",
    cmd = "ConformInfo",
    keys = {
        {
            "<leader>f",
            function() require("conform").format({ async = true }) end,
            desc = "Format buffer",
        },
    },
    opts = {
        -- C/C++ (clang-format), Go (gofmt), Rust (rustfmt), Python (ruff) and Lua format through their language servers
        default_format_opts = { lsp_format = "fallback" },
        formatters_by_ft = {
            javascript = { "prettierd" },
            javascriptreact = { "prettierd" },
            typescript = { "prettierd" },
            typescriptreact = { "prettierd" },
            html = { "prettierd" },
            css = { "prettierd" },
            json = { "prettierd" },
            markdown = { "prettierd" },
        },
    },
}
