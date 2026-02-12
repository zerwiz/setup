defmodule AiDevSuiteTui.API do
  @moduledoc """
  HTTP API server for the AI Dev Suite. Runs Plug.Cowboy with ApiRouter.
  Start with: mix run -e "AiDevSuiteTui.API.start()"
  """

  def start do
    port = Application.get_env(:ai_dev_suite_tui, :api_port, 41_434)
    {:ok, _} = Plug.Cowboy.http(AiDevSuiteTui.ApiRouter, [], port: port)
    IO.puts("Zerwiz AI Dev Suite API running at http://localhost:#{port}")
    IO.puts("Press Ctrl+C to stop")
    Process.sleep(:infinity)
  end
end
