defmodule AiDevSuiteTui.MixProject do
  use Mix.Project

  @version "0.1.0"

  def project do
    [
      app: :ai_dev_suite_tui,
      version: @version,
      elixir: ">= 1.14.0",
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
    [
      {:plug_cowboy, "~> 2.6"},
      {:plug, "~> 1.15"},
      {:plug_crypto, "~> 2.0"},
      {:jason, "~> 1.4"}
    ]
  end

  defp escript_config do
    [main_module: AiDevSuiteTui.CLI]
  end
end
