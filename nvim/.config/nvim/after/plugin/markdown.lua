local render_markdown = require('render-markdown')

vim.keymap.set("n", "<leader>mt", render_markdown.toggle, { desc = "Toggle markdown rendering" })
