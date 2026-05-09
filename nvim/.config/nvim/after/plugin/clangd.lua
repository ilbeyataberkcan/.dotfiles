local function is_unreal_root(root_dir)
  if not root_dir or root_dir == "" then
    return false
  end

  return #vim.fn.globpath(root_dir, "*.uproject", false, true) > 0
end

local function build_clangd_cmd(root_dir)
  local cmd = {
    "clangd",
    "--background-index",
    "--clang-tidy=false",
    "--header-insertion=never",
  }

  if is_unreal_root(root_dir) then
    table.insert(cmd, "--query-driver=/Mergen/UnrealEngine/**")
  end

  return cmd
end

vim.lsp.config("clangd", {
  cmd = function(dispatchers, config)
    return vim.lsp.rpc.start(build_clangd_cmd(config.root_dir), dispatchers, {
      cwd = config.cmd_cwd,
      env = config.cmd_env,
      detached = config.detached,
    })
  end,
})

vim.lsp.enable("clangd")
