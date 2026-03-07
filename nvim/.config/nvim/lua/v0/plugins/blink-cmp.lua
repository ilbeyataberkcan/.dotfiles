return {
    'saghen/blink.cmp',
    version = 'v1.*',
    lazy = true,
    dependencies = {
        'rafamadriz/friendly-snippets',
        'folke/lazydev.nvim',
        'taku25/blink-cmp-unreal'
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
                "unreal"
            },
            providers = {
                lazydev = {
                    name = "LazyDev",
                    module = "lazydev.integrations.blink",
                    score_offset = 100
                },
                unreal = {
                    module = 'blink-cmp-unreal',
                    name = 'unreal',
                    score_offset = 10
                }
            }
        },
    },
    opts_extend = { "sources.default"}
}
