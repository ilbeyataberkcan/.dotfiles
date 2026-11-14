return {
    'saghen/blink.cmp',
    version = '1.*',
    dependencies = {
        'rafamadriz/friendly-snippets',
        'folke/lazydev.nvim',
    },

    opts = {
        keymap = { preset = 'default' },

        appearance = {
            use_nvim_cmp_as_default = true,
            nerd_font_variant = 'mono'
        },

        signature = { enabled = true },
        sources = {
            default = {
                "snippets",
                "lsp",
                "path",
                "buffer",
                "lazydev",
            },
            providers = {
                lazydev = {
                    name = "LazyDev",
                    module = "lazydev.integrations.blink",
                    score_offset = 100
                },
            }
        },
    },
    opts_extend = { "sources.default"}
}
