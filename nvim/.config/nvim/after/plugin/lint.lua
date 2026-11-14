local lint = require("lint")

-- Linters outside the language servers (clang-tidy, clippy, ruff and eslint run through LSP).
lint.linters_by_ft = {
    go = { "golangcilint" },
    markdown = { "markdownlint-cli2" },
    html = { "htmlhint" },
}

-- Skip linters whose binary is missing (e.g. mason is still installing) instead of erroring.
local function is_available(name)
    local linter = lint.linters[name]
    if type(linter) == "function" then
        linter = linter()
    end
    local cmd = type(linter.cmd) == "function" and linter.cmd() or linter.cmd
    return vim.fn.executable(cmd) == 1
end

vim.api.nvim_create_autocmd({ "BufReadPost", "BufWritePost", "InsertLeave" }, {
    group = vim.api.nvim_create_augroup("v0_lint", { clear = true }),
    callback = function(args)
        local names = vim.tbl_filter(is_available, lint.linters_by_ft[vim.bo[args.buf].filetype] or {})
        if #names > 0 then
            lint.try_lint(names)
        end
    end,
})

vim.keymap.set("n", "<leader>vl", function()
    local names = vim.tbl_filter(is_available, lint.linters_by_ft[vim.bo.filetype] or {})
    if #names == 0 then
        vim.notify("No linter for " .. vim.bo.filetype .. " (LSP diagnostics still apply)", vim.log.levels.INFO, { annote = "Lint" })
        return
    end
    lint.try_lint(names)
    vim.notify("Running " .. table.concat(names, ", "), vim.log.levels.INFO, { annote = "Lint" })
end, { desc = "Run linters" })
