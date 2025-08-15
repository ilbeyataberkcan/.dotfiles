local function attach(opts)
    vim.keymap.set('n', "gd", function() vim.lsp.buf.definition() end, opts)
    vim.keymap.set('n', "K", function () vim.lsp.buf.hover() end, opts)
    vim.keymap.set('n', "<leader>vws", function() vim.lsp.buf.workspace_symbol() end, opts)
    vim.keymap.set('n', "<leader>vd", function() vim.diagnostic.open_float() end, opts)
    vim.keymap.set('n', "[d", function() vim.diagnostic.goto_next() end, opts)
    vim.keymap.set('n', "]d", function() vim.diagnostic.goto_prev() end, opts)
    vim.keymap.set('n', "<leader>vca", function() vim.lsp.buf.code_action() end, opts)
    vim.keymap.set('n', "<leader>vrr", function() vim.lsp.buf.references() end, opts)
    vim.keymap.set('n', "<leader>vrn", function() vim.lsp.buf.rename() end, opts)
    vim.keymap.set('n', "<C-h>", function() vim.lsp.buf.signature_help() end, opts)
end


return {
    {
        "neovim/nvim-lspconfig",
        dependencies = {
            { 'mason-org/mason.nvim', opts = {} },
            'mason-org/mason-lspconfig.nvim',
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

        config = function(opts)
            local capabilities = require('blink.cmp').get_lsp_capabilities()
            local lspconfig = require('lspconfig')

            require('mason').setup()
            require('mason-lspconfig').setup {
                ensure_installed = {
                    "lua_ls",
                    "clangd"
                }
            }

            -- add language servers
            lspconfig.lua_ls.setup { capabilities = capabilities }
            lspconfig.clangd.setup { capabilities = capabilities }
            attach()
        end
    }
} 
