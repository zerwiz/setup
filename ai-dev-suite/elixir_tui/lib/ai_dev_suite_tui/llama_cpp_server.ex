defmodule AiDevSuiteTui.LlamaCppServer do
  @moduledoc """
  Manages llama.cpp server process. Start/stop, status, config.
  """

  use GenServer

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, nil, [name: __MODULE__] ++ opts)
  end

  def get_config do
    GenServer.call(__MODULE__, :get_config)
  end

  def put_config(params), do: GenServer.call(__MODULE__, {:put_config, params})

  def start_server, do: GenServer.call(__MODULE__, :start_server)
  def stop_server, do: GenServer.call(__MODULE__, :stop_server)
  def status, do: GenServer.call(__MODULE__, :status)

  def config_path do
    Path.join(AiDevSuiteTui.api_config_dir(), "server_config.json")
  end

  @impl true
  def init(_) do
    {:ok, %{pid: nil, port: nil}}
  end

  @impl true
  def handle_call(:get_config, _from, state) do
    cfg = load_config()
    {:reply, cfg, state}
  end

  def handle_call({:put_config, params}, _from, state) when is_map(params) do
    result = save_config(params)
    {:reply, result, state}
  end

  def handle_call(:start_server, _from, state) do
    if state.pid && Process.alive?(state.pid) do
      {:reply, {:ok, %{port: state.port, running: true}}, state}
    else
      case do_start(state) do
        {:ok, new_state} ->
          {:reply, {:ok, %{port: new_state.port, running: true}}, new_state}
        {:error, reason} ->
          {:reply, {:error, reason}, state}
      end
    end
  end

  def handle_call(:stop_server, _from, state) do
    if state.pid && Process.alive?(state.pid) do
      Process.exit(state.pid, :kill)
    end
    {:reply, :ok, %{state | pid: nil, port: nil}}
  end

  def handle_call(:status, _from, state) do
    running = state.pid != nil && Process.alive?(state.pid)
    cfg = load_config()
    {:reply, %{
      running: running,
      port: state.port,
      model_path: cfg["model_path"],
      server_path: cfg["server_path"]
    }, state}
  end

  defp load_config do
    path = config_path()
    default = %{"model_path" => "", "port" => 8080, "server_path" => ""}
    if File.exists?(path) do
      case File.read(path) |> elem(1) |> Jason.decode() do
        {:ok, map} when is_map(map) -> Map.merge(default, map)
        _ -> default
      end
    else
      default
    end
  end

  defp save_config(params) do
    path = config_path()
    File.mkdir_p!(Path.dirname(path))
    current = load_config()
    port = case params["port"] || current["port"] do
      n when is_integer(n) -> n
      n when is_binary(n) -> String.to_integer(n)
      _ -> 8080
    end
    updated = current
      |> Map.merge(params)
      |> Map.put("port", port)
      |> Map.take(["model_path", "port", "server_path"])
    File.write!(path, Jason.encode!(updated))
    {:ok, updated}
  end

  defp do_start(state) do
    cfg = load_config()
    model = String.trim(cfg["model_path"] || "")
    port = cfg["port"] || 8080
    server_path = String.trim(cfg["server_path"] || "")

    if model == "" do
      {:error, "Model path is required"}
    else
      bin = resolve_server_binary(server_path)
      if bin do
        port_num = if is_integer(port), do: port, else: 8080
        # spawn process that runs the server; it will run until killed
        args = ["-m", model, "--port", to_string(port_num)]
        pid = spawn_server_process(bin, args)
        Process.sleep(500)
        new_state = %{state | pid: pid, port: port_num}
        {:ok, new_state}
      else
        {:error, "llama.cpp server binary not found. Set server_path in config."}
      end
    end
  end

  defp resolve_server_binary(""), do: System.find_executable("server") || find_llamacpp_server()
  defp resolve_server_binary(path) do
    if File.exists?(path) && File.regular?(path), do: path, else: nil
  end

  defp find_llamacpp_server do
    home = System.get_env("HOME") || System.get_env("USERPROFILE") || ""
    candidates = [
      Path.join(home, "llama.cpp/build/bin/server"),
      Path.join(home, "llama.cpp/server"),
      "/usr/local/bin/llama-server",
      "/usr/local/bin/server"
    ]
    Enum.find(candidates, &(File.exists?(&1) && File.regular?(&1)))
  end

  defp spawn_server_process(bin, args) do
    cmd = Enum.map_join([bin | args], " ", &arg_escape/1)
    spawn(fn ->
      # Port owns the OS process. When this process exits, Port.close kills the child.
      port = Port.open({:spawn, cmd}, [:binary, :exit_status, :stderr_to_stdout])
      # Block until port exits (server stopped)
      receive do
        {^port, {:exit_status, _}} -> :ok
      end
    end)
  end

  defp arg_escape(s) when is_binary(s) do
    if String.contains?(s, [" ", "\"", "'"]) do
      "\"" <> String.replace(s, "\"", "\\\"") <> "\""
    else
      s
    end
  end
  defp arg_escape(s), do: arg_escape(to_string(s))
end
