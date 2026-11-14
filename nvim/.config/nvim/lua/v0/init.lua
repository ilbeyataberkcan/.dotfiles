require("v0.set")
require("v0.remap")

vim.api.nvim_create_autocmd('LspAttach', {
    group = vim.api.nvim_create_augroup('UserLspConfig', {}),
    callback = function (ev)
        vim.bo[ev.buf].omnifunc = 'v:lua.vim.lsp.omnifunc'

        local opts = { buffer = ev.buf }
        vim.keymap.set('n', "gd", function() vim.lsp.buf.definition() end, opts)
        vim.keymap.set('n', "gD", function() vim.lsp.buf.declaration() end, opts)
        vim.keymap.set('n', "K", function () vim.lsp.buf.hover() end, opts)
        vim.keymap.set('n', "<leader>vws", function() vim.lsp.buf.workspace_symbol() end, opts)
        vim.keymap.set('n', "<leader>vd", function() vim.diagnostic.open_float() end, opts)
        vim.keymap.set('n', "<leader>vca", function() vim.lsp.buf.code_action() end, opts)
        vim.keymap.set('n', "<leader>vrr", function() vim.lsp.buf.references() end, opts)
        vim.keymap.set('n', "<leader>vrn", function() vim.lsp.buf.rename() end, opts)
        vim.keymap.set('n', "<leader>vi", function() vim.lsp.buf.implementation() end, opts)
        -- Restart only this buffer's servers (e.g. after creating a module the server missed)
        vim.keymap.set('n', "<leader>vrs", function()
            local names = vim.tbl_map(function(client) return client.name end, vim.lsp.get_clients({ bufnr = 0 }))
            vim.cmd("lsp restart " .. table.concat(names, " "))
        end, opts)
        vim.keymap.set('n', "<leader>sh", function() vim.lsp.buf.signature_help() end, opts)
    end

})

