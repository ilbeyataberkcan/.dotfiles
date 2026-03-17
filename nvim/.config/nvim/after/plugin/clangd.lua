vim.lsp.config("clangd", {
       cmd = {
         "clangd",
         "--background-index",
         "--clang-tidy=false",
         "--header-insertion=never",
       },
})

vim.lsp.enable( "clangd" )
