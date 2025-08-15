local builtin = require('telescope.builtin')
local telescope = require('telescope')

telescope.setup {
    extensions = {
        fzf = {}
    },

    telescope.load_extension('fzf')
}

vim.keymap.set('n', '<leader>fh', builtin.help_tags)
vim.keymap.set('n', '<leader>fd', builtin.find_files)
vim.keymap.set('n', '<leader>fs', function()
    builtin.grep_string({ search = vim.fn.input("Grep > ") });
end)

-- Kind of unneccesarry allows you to search source files of plugins to find implementation details
vim.keymap.set('n', '<leader>ep', function()
    require('telescope.builtin').find_files {
        cwd = vim.fs.joinpath(vim.fn.stdpath("data"), "lazy")
    }
end)

vim.keymap.set('n', '<leader>en', function()
    require('telescope.builtin').find_files {
        cwd = vim.fn.stdpath("config")
    }
end)

vim.keymap.set('n', '<C-p>', builtin.git_files, {})

require "v0.telescope.multigrep".setup()
