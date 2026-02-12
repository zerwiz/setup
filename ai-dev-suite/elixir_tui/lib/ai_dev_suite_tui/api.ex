defmodule AiDevSuiteTui.API do
  @moduledoc """
  HTTP API server for the AI Dev Suite. Runs Plug.Cowboy with ApiRouter.
  Start with: mix run -e "AiDevSuiteTui.API.start()"
  """

  def start do
    spawn(&ensure_rag_deps/0)
    port = Application.get_env(:ai_dev_suite_tui, :api_port, 41_434)
    {:ok, _} = Plug.Cowboy.http(AiDevSuiteTui.ApiRouter, [], port: port)
    IO.puts("Zerwiz AI Dev Suite API running at http://localhost:#{port}")
    IO.puts("Press Ctrl+C to stop")
    Process.sleep(:infinity)
  end

  defp ensure_rag_deps do
    cwd = File.cwd!()
    req_candidates = [
      Path.expand(Path.join([cwd, "..", "..", "rag", "requirements.txt"])),
      Path.expand(Path.join([cwd, "..", "..", "..", "tools", "rag", "requirements.txt"]))
    ]
    case Enum.find(req_candidates, &File.exists?/1) do
      nil -> :ok
      req ->
        python = System.find_executable("python3") || System.find_executable("python")
        if python do
          System.cmd(python, ["-m", "pip", "install", "-q", "-r", req], stderr_to_stdout: false)
        end
        :ok
    end
  end
end
