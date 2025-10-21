return {
    {
        "taku25/UNL.nvim",
        opts= {},
    },
    {
        "taku25/UBT.nvim",
        dependencies = {
            "taku25/UNL.nvim",
            "nvim-telescope/telescope.nvim"
        },
        ft = {"cpp", "h"},
        opts = {}
    },
    {
        "taku25/UCM.nvim",
        dependencies = {
            "taku25/UNL.nvim",
            "nvim-telescope/telescope.nvim"
        },
        ft = {"cpp", "h"},
        opts = {}
    },
    {
        "taku25/ULG.nvim",
        dependencies = {
            "taku25/UNL.nvim",
        },
        opts = {}
    },
    {
        "taku25/UEP.nvim",
        dependencies = {
            "taku25/UNL.nvim",
            "nvim-telescope/telescope.nvim"
        },
        ft = {"cpp", "h"},
        opts = {}
    },
}
