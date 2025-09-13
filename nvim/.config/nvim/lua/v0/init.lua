require("v0.set")
require("v0.remap")


vim.api.nvim_create_autocmd('LspAttach', {
    group = vim.api.nvim_create_augroup('UserLspConfig', {}),
    callback = function (ev)
        vim.bo[ev.buf].omnifunc = 'v:lua.vim.lsp.omnifunc'

        vim.keymap.set('n', "gd", function() vim.lsp.buf.definition() end)
        vim.keymap.set('n', "gD", function() vim.lsp.buf.declaration() end)
        vim.keymap.set('n', "K", function () vim.lsp.buf.hover() end)
        vim.keymap.set('n', "<leader>vws", function() vim.lsp.buf.workspace_symbol() end)
        vim.keymap.set('n', "<leader>vd", function() vim.diagnostic.open_float() end)
        vim.keymap.set('n', "<leader>vca", function() vim.lsp.buf.code_action() end)
        vim.keymap.set('n', "<leader>vrr", function() vim.lsp.buf.references() end)
        vim.keymap.set('n', "<leader>vrn", function() vim.lsp.buf.rename() end)
        vim.keymap.set('n', "<C-h>", function() vim.lsp.buf.signature_help() end)
    end

})
