-- Per-server overrides, merged over the nvim-lspconfig defaults.

vim.lsp.config("clangd", {
    cmd = {
        "clangd",
        "--background-index",
        "--clang-tidy", -- reads the project's .clang-tidy
        "--header-insertion=never",
    },
})

vim.lsp.config("gopls", {
    settings = {
        gopls = {
            staticcheck = true,
            semanticTokens = true,
            analyses = {
                unusedparams = true,
                shadow = true,
            },
        },
    },
})

vim.lsp.config("rust_analyzer", {
    settings = {
        ["rust-analyzer"] = {
            check = {
                command = "clippy",
            },
        },
    },
})

-- TypeScript 7+ ships a native server (`tsc --lsp`) and no tsserver.js, so ts_ls cannot drive it.
-- Each project gets exactly one: the native server when its node_modules has TS 7+, ts_ls otherwise.
local native_tsc_cache = {}

local function native_tsc(root)
    if native_tsc_cache[root] == nil then
        local bin = vim.fs.joinpath(root, "node_modules", ".bin", "tsc")
        local version = vim.fn.executable(bin) == 1
            and vim.version.parse(vim.system({ bin, "--version" }, { text = true }):wait().stdout or "")
        native_tsc_cache[root] = (version and version.major >= 7) and bin or false
    end
    return native_tsc_cache[root] or nil
end

local ts_root_dir = vim.lsp.config.ts_ls.root_dir

vim.lsp.config("ts_ls", {
    root_dir = function(bufnr, on_dir)
        ts_root_dir(bufnr, function(root)
            if not native_tsc(root) then
                on_dir(root)
            end
        end)
    end,
})

vim.lsp.config("tsc", {
    cmd = function(dispatchers, config)
        return vim.lsp.rpc.start({ native_tsc(config.root_dir), "--lsp", "--stdio" }, dispatchers)
    end,
    root_dir = function(bufnr, on_dir)
        ts_root_dir(bufnr, function(root)
            if native_tsc(root) then
                on_dir(root)
            end
        end)
    end,
})

-- tsc comes from each project's node_modules, not mason, so it is enabled here
vim.lsp.enable("tsc")

vim.lsp.config("basedpyright", {
    settings = {
        basedpyright = {
            disableOrganizeImports = true, -- ruff owns imports
            analysis = {
                typeCheckingMode = "standard",
            },
        },
    },
})

vim.lsp.config("ruff", {
    on_attach = function(client)
        -- basedpyright owns hover
        client.server_capabilities.hoverProvider = false
    end,
})
