defmodule AiDevSuiteTui do
  @moduledoc """
  AI Dev Suite – Interactive terminal interface for installing AI dev tools.
  WhyNot Productions · whynotproductions.netlify.app
  """

  @tools [
    %{id: "ollama", name: "Ollama", desc: "Run LLMs locally. Simple setup.",
      cmd: "curl -fsSL https://ollama.com/install.sh | sh", url: "https://ollama.com"},
    %{id: "zed", name: "Zed", desc: "High performance code editor.",
      cmd: "curl -fsSL https://zed.dev/install.sh | sh", url: "https://zed.dev"},
    %{id: "lm", name: "LM Studio", desc: "Local LLM runner. Discover models.",
      cmd: "curl -fsSL -L https://lmstudio.ai/install.sh | sh", url: "https://lmstudio.ai"},
    %{id: "pinokio", name: "Pinokio", desc: "Browser for AI apps. Auto install.",
      cmd: "curl -fsSL https://pinokio.computer/install.sh | sh", url: "https://pinokio.computer"},
    %{id: "claw", name: "ClawCode", desc: "Terminal editor. AI workflows.",
      cmd: "curl -fsSL https://clawcode.ai/install.sh | sh", url: "https://clawcode.ai"}
  ]

  @red "\e[91m"
  @cyan "\e[96m"
  @white "\e[1;37m"
  @dim "\e[2m"
  @reset "\e[0m"

  def tools, do: @tools

  def run_install(cmd) do
    {_output, exit_code} = System.cmd("sh", ["-c", cmd], into: IO.stream(:stdio, :line))
    exit_code
  end

  def format_tool(i, tool) do
    "#{@red}[#{i}]#{@reset} #{@white}#{tool.name}#{@reset} – #{@dim}#{tool.desc}#{@reset}\n    #{@cyan}#{tool.url}#{@reset}"
  end
end
