defmodule AiDevSuiteTui.API do
  @moduledoc """
  HTTP API server for the AI Dev Suite. Runs Plug.Cowboy with ApiRouter.
  Start with: mix run -e "AiDevSuiteTui.API.start()"
  """

  def start do
    spawn(&ensure_rag_deps/0)
    case AiDevSuiteTui.LlamaCppServer.start_link() do
      {:ok, _} -> :ok
      {:error, {:already_started, _}} -> :ok
      _ -> :ok
    end
    port = Application.get_env(:ai_dev_suite_tui, :api_port, 41_434)
    case Plug.Cowboy.http(AiDevSuiteTui.ApiRouter, [], port: port) do
      {:ok, _} ->
        IO.puts("Zerwiz AI Dev Suite API running at http://localhost:#{port}")
        IO.puts("Press Ctrl+C to stop")
        Process.sleep(:infinity)
      {:error, :eaddrinuse} ->
        IO.puts(:stderr, "Port #{port} is already in use. Stop the other API process (e.g. another Electron or api instance).")
        System.halt(1)
    end
  end

  defp ensure_rag_deps do
    case AiDevSuiteTui.find_rag_requirements() do
      nil -> :ok
      req ->
        python = System.find_executable("python3") || System.find_executable("python")
        if python do
          # Run via sh to suppress "No module named pip" etc.; non-fatal
          # $0,$1 = python path, req path (safe for spaces)
          System.cmd("sh", ["-c", "p=\"$0\"; r=\"$1\"; \"$p\" -m pip install -q -r \"$r\" 2>/dev/null || true", python, req])
        end
        :ok
    end
  end
end
