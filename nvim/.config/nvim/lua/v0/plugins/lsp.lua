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
                },
                handlers = {
                    function(server_name)
                        require("lspconfig")[server_name].setup {
                            capabilities = capabilities
                        }
                    end
                }

            }
        end
    }
} 
