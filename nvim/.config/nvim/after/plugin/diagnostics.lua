local namespace =  vim.api.nvim_create_namespace('vim_config_v0')

vim.diagnostic.config({
    virtual_lines = false,
    virtual_text = false,
})

local orig_signs_handler = vim.diagnostic.handlers.signs

vim.diagnostic.handlers.sign = {
    show = function(_, bufnr, _, opts)
        local diagnostics = vim.diagnostic.get(bufnr)


        -- Highes severity per line
        local max_severity_per_line = {}
        for _, d in pairs(diagnostics) do
            local m = max_severity_per_line[d.lnum]
            if not m or d.severity < m.severity then
                max_severity_per_line[d.lnum] = d
            end
        end

        -- Update the original handler with our filtered_diagnostics and custom namespace
        local filtered_diagnostics = vim.tbl_values(max_severity_per_line)
        orig_signs_handler.show(namespace, bufnr, filtered_diagnostics, opts)
    end,
    hide = function(_, bufnr)
        orig_signs_handler.hide(namespace, bufnr)
    end

}


vim.keymap.set('n', "<leader>K", function()
    local new_config = not vim.diagnostic.config().virtual_lines
    vim.diagnostic.config({virtual_lines = new_config})
end, {desc = "Toggle diagnostics virtual_lines"} )
