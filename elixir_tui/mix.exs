defmodule AiDevSuiteTui.MixProject do
  use Mix.Project

  @version "0.1.0"

  def project do
    [
      app: :ai_dev_suite_tui,
      version: @version,
      elixir: "~> 1.15",
      escript: escript_config(),
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger]
    ]
  end

  defp deps do
    []
  end

  defp escript_config do
    [main_module: AiDevSuiteTui.CLI]
  end
end
