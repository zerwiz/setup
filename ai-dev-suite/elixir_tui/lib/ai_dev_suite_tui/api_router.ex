defmodule CORSPlug do
  import Plug.Conn
  def init(opts), do: opts
  def call(conn, _opts) do
    conn
    |> put_resp_header("access-control-allow-origin", "*")
    |> put_resp_header("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS")
    |> put_resp_header("access-control-allow-headers", "Content-Type")
  end
end

defmodule OptionsPlug do
  import Plug.Conn
  def init(opts), do: opts
  def call(conn, _opts) do
    if conn.method == "OPTIONS" do
      conn |> send_resp(204, "") |> halt()
    else
      conn
    end
  end
end

defmodule RateLimitPlug do
  @moduledoc "Per-IP rate limiting for /api/research. Set RAG_RATE_LIMIT_PER_MIN env (default 60)."
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    if conn.request_path == "/api/research" and conn.method == "POST" do
      check_rate_limit(conn)
    else
      conn
    end
  end

  defp check_rate_limit(conn) do
    limit = parse_limit(System.get_env("RAG_RATE_LIMIT_PER_MIN", "60"))
    if limit <= 0 do
      conn
    else
      key = conn.remote_ip |> :inet.ntoa() |> to_string()
      now_ms = System.system_time(:millisecond)
      window_ms = 60_000
      tab = :rag_rate_limit
      if :ets.whereis(tab) == :undefined do
        :ets.new(tab, [:named_table, :set, :public])
      end
      ts = case :ets.lookup(tab, key) do
        [{^key, list}] -> prune_and_count(list, now_ms - window_ms)
        [] -> []
      end
      count = length(ts)
      if count >= limit do
        conn
        |> put_resp_content_type("application/json")
        |> send_resp(429, Jason.encode!(%{error: "Rate limit exceeded. Try again later."}))
        |> halt()
      else
        :ets.insert(tab, {key, [now_ms | ts]})
        conn
      end
    end
  end

  defp prune_and_count(list, cutoff) do
    list |> Enum.filter(&(&1 > cutoff)) |> Enum.sort(:desc)
  end

  defp parse_limit(s) when is_binary(s) do
    case Integer.parse(s) do
      {n, _} -> max(0, n)
      _ -> 60
    end
  end
  defp parse_limit(_), do: 60
end

defmodule AiDevSuiteTui.ApiRouter do
  use Plug.Router
  require Logger

  plug(Plug.Logger)
  plug(RateLimitPlug)
  plug(:match)
  plug(Plug.Parsers,
    parsers: [{:multipart, length: 50_000_000}, :json],
    json_decoder: Jason
  )
  plug(CORSPlug)
  plug(OptionsPlug)
  plug(:dispatch)

  get "/api/tools" do
    tools = AiDevSuiteTui.tools() |> Enum.with_index(1) |> Enum.map(fn {t, i} -> %{index: i, id: t.id, name: t.name, desc: t.desc, url: t.url, cmd: t.cmd} end)
    send_json(conn, 200, %{tools: tools})
  end

  post "/api/install" do
    idx = conn.body_params["index"] || conn.body_params["tool_index"]
    i = parse_index(idx)
    case i do
      nil -> send_json(conn, 400, %{error: "index required"})
      i when is_integer(i) and i > 0 ->
        tools = AiDevSuiteTui.tools()
        tool = Enum.at(tools, i - 1)
        if tool do
          code = AiDevSuiteTui.run_install(tool.cmd)
          send_json(conn, 200, %{ok: code == 0, exit_code: code})
        else
          send_json(conn, 404, %{error: "tool not found"})
        end
      _ -> send_json(conn, 400, %{error: "index must be positive integer"})
    end
  end

  get "/api/ollama/models" do
    case AiDevSuiteTui.list_ollama_models() do
      {:ok, models} -> send_json(conn, 200, %{models: models})
      {:error, _} -> send_json(conn, 503, %{error: "Ollama not found"})
    end
  end

  post "/api/ollama/pull" do
    name = conn.body_params["model"] || conn.body_params["name"]
    case AiDevSuiteTui.pull_ollama_model(name || "") do
      {:ok, _} -> send_json(conn, 200, %{ok: true})
      {:error, :invalid} -> send_json(conn, 400, %{error: "model name required"})
      {:error, :not_found} -> send_json(conn, 503, %{error: "Ollama not found"})
      {:error, code} -> send_json(conn, 500, %{error: "pull failed", exit_code: code})
    end
  end

  post "/api/ollama/start" do
    case AiDevSuiteTui.start_ollama() do
      {:ok, _} -> send_json(conn, 200, %{ok: true})
      {:error, _} -> send_json(conn, 503, %{error: "Ollama not found"})
    end
  end

  get "/api/downloadable_models" do
    send_json(conn, 200, %{models: AiDevSuiteTui.downloadable_models()})
  end

  post "/api/chat" do
    model = conn.body_params["model"] || "llama3.2:latest"
    messages = conn.body_params["messages"] || []
    kbs = conn.body_params["knowledge_bases"] || conn.body_params["knowledgeBases"]
    kb = conn.body_params["knowledge_base"] || conn.body_params["knowledgeBase"]
    system = cond do
      is_list(kbs) and kbs != [] -> AiDevSuiteTui.api_build_system_prompt(kbs)
      is_binary(kb) and kb != "" -> AiDevSuiteTui.api_build_system_prompt(kb)
      true -> AiDevSuiteTui.api_build_system_prompt("default")
    end
    all = [%{"role" => "system", "content" => system} | Enum.map(messages, &stringify_keys/1)]
    opts = conn.body_params["options"] || []
    case AiDevSuiteTui.api_chat_send(model, all, opts) do
      {:ok, %{"message" => %{"content" => content}}} ->
        send_json(conn, 200, %{reply: content})
      {:error, err} ->
        send_json(conn, 500, %{error: to_string(err)})
    end
  end

  post "/api/chat/stream" do
    model = conn.body_params["model"] || "llama3.2:latest"
    messages = conn.body_params["messages"] || []
    kbs = conn.body_params["knowledge_bases"] || conn.body_params["knowledgeBases"]
    kb = conn.body_params["knowledge_base"] || conn.body_params["knowledgeBase"]
    system = cond do
      is_list(kbs) and kbs != [] -> AiDevSuiteTui.api_build_system_prompt(kbs)
      is_binary(kb) and kb != "" -> AiDevSuiteTui.api_build_system_prompt(kb)
      true -> AiDevSuiteTui.api_build_system_prompt("default")
    end
    all = [%{"role" => "system", "content" => system} | Enum.map(messages, &stringify_keys/1)]
    opts = conn.body_params["options"] || []
    internet_enabled = conn.body_params["internet_enabled"] == true
    conn = conn
      |> put_resp_content_type("application/x-ndjson; charset=utf-8")
      |> send_chunked(200)
    parent = self()
    callback = fn
      :delta, content ->
        send(parent, {:stream_chunk, Jason.encode!(%{delta: content}) <> "\n"})
      :done, _ ->
        send(parent, {:stream_chunk, Jason.encode!(%{done: true}) <> "\n"})
        send(parent, :stream_done)
      :error, msg ->
        send(parent, {:stream_chunk, Jason.encode!(%{error: msg}) <> "\n"})
        send(parent, :stream_done)
    end
    spawn(fn ->
      AiDevSuiteTui.api_chat_send_stream(model, all, callback, opts, internet_enabled)
    end)
    stream_chat_loop(conn)
  end

  get "/api/memory" do
    send_json(conn, 200, %{content: AiDevSuiteTui.api_memory_content()})
  end

  get "/api/memory/manual" do
    send_json(conn, 200, %{content: AiDevSuiteTui.api_memory_manual()})
  end

  get "/api/memory/conv" do
    send_json(conn, 200, %{content: AiDevSuiteTui.api_memory_conv()})
  end

  get "/api/memory/models" do
    send_json(conn, 200, %{models: AiDevSuiteTui.api_memory_models()})
  end

  post "/api/memory/remember" do
    text = conn.body_params["text"] || ""
    model = conn.body_params["model"] || "llama3.2:latest"
    AiDevSuiteTui.api_remember(text, model)
    send_json(conn, 200, %{ok: true})
  end

  put "/api/memory/manual" do
    content = conn.body_params["content"] || conn.body_params["text"] || ""
    case AiDevSuiteTui.api_write_memory_manual(content) do
      {:ok, _} -> send_json(conn, 200, %{ok: true})
      {:error, err} -> send_json(conn, 500, %{error: to_string(err)})
    end
  end

  put "/api/memory/conv" do
    content = conn.body_params["content"] || conn.body_params["text"] || ""
    case AiDevSuiteTui.api_write_memory_conv(content) do
      {:ok, _} -> send_json(conn, 200, %{ok: true})
      {:error, err} -> send_json(conn, 500, %{error: to_string(err)})
    end
  end

  post "/api/bye" do
    model = conn.body_params["model"] || "llama3.2:latest"
    messages = conn.body_params["messages"] || []
    AiDevSuiteTui.api_extract_conversation_facts(model, messages)
    send_json(conn, 200, %{ok: true})
  end

  get "/api/behavior" do
    send_json(conn, 200, %{content: AiDevSuiteTui.api_behavior_content()})
  end

  post "/api/behavior" do
    text = conn.body_params["text"] || ""
    AiDevSuiteTui.api_behavior_append(text)
    send_json(conn, 200, %{ok: true})
  end

  put "/api/behavior" do
    content = conn.body_params["content"] || conn.body_params["text"] || ""
    case AiDevSuiteTui.api_write_behavior(content) do
      {:ok, _} -> send_json(conn, 200, %{ok: true})
      {:error, err} -> send_json(conn, 500, %{error: to_string(err)})
    end
  end

  get "/api/drive" do
    lines = AiDevSuiteTui.list_drive_contents()
    send_json(conn, 200, %{items: lines})
  end

  post "/api/drive" do
    path = conn.body_params["path"] || conn.body_params["source"] || ""
    case AiDevSuiteTui.add_to_drive(path) do
      {:ok, msg} -> send_json(conn, 200, %{ok: true, message: msg})
      {:error, err} -> send_json(conn, 400, %{error: to_string(err)})
    end
  end

  get "/api/knowledge-bases" do
    send_json(conn, 200, %{knowledge_bases: AiDevSuiteTui.list_knowledge_bases()})
  end

  post "/api/knowledge-bases" do
    name = conn.body_params["name"] || conn.body_params["id"] || ""
    case AiDevSuiteTui.create_knowledge_base(name) do
      {:ok, msg} -> send_json(conn, 200, %{ok: true, message: msg})
      {:error, err} -> send_json(conn, 400, %{error: to_string(err)})
    end
  end

  get "/api/knowledge-bases/:name/contents" do
    name = conn.path_params["name"]
    items = AiDevSuiteTui.list_knowledge_base_contents_with_paths(name) |> Enum.map(fn {path, display} -> %{path: path, display: display} end)
    send_json(conn, 200, %{items: items})
  end

  post "/api/knowledge-bases/:name/delete" do
    name = conn.path_params["name"]
    path = conn.body_params["path"] || conn.body_params["rel_path"] || ""
    case AiDevSuiteTui.delete_from_knowledge_base(name, path) do
      {:ok, msg} -> send_json(conn, 200, %{ok: true, message: msg})
      {:error, err} -> send_json(conn, 400, %{error: to_string(err)})
    end
  end

  post "/api/knowledge-bases/:name/delete-batch" do
    name = conn.path_params["name"]
    paths = conn.body_params["paths"] || conn.body_params["path"] || []
    paths = if is_binary(paths), do: [paths], else: paths
    case AiDevSuiteTui.delete_batch_from_knowledge_base(name, paths) do
      {:ok, msg} -> send_json(conn, 200, %{ok: true, message: msg})
      {:error, err} -> send_json(conn, 400, %{error: to_string(err)})
    end
  end

  post "/api/knowledge-bases/:name/delete-all" do
    name = conn.path_params["name"]
    case AiDevSuiteTui.delete_all_from_knowledge_base(name) do
      {:ok, msg} -> send_json(conn, 200, %{ok: true, message: msg})
      {:error, err} -> send_json(conn, 400, %{error: to_string(err)})
    end
  end

  delete "/api/knowledge-bases/:name" do
    name = conn.path_params["name"]
    case AiDevSuiteTui.delete_knowledge_base(name) do
      {:ok, msg} -> send_json(conn, 200, %{ok: true, message: msg})
      {:error, err} -> send_json(conn, 400, %{error: to_string(err)})
    end
  end

  post "/api/knowledge-bases/:name/add" do
    name = conn.path_params["name"]
    path = conn.body_params["path"] || conn.body_params["source"] || conn.body_params["url"] || ""
    case AiDevSuiteTui.add_to_knowledge_base(name, path) do
      {:ok, msg} -> send_json(conn, 200, %{ok: true, message: msg})
      {:error, err} -> send_json(conn, 400, %{error: to_string(err)})
    end
  end

  post "/api/knowledge-bases/:name/upload" do
    name = conn.path_params["name"]
    upload = conn.body_params["file"] || conn.body_params["document"]
    case upload do
      %Plug.Upload{} ->
        case AiDevSuiteTui.add_to_knowledge_base(name, upload) do
          {:ok, msg} -> send_json(conn, 200, %{ok: true, message: msg})
          {:error, err} -> send_json(conn, 400, %{error: to_string(err)})
        end
      _ -> send_json(conn, 400, %{error: "No file uploaded (use form field 'file')"})
    end
  end

  post "/api/research" do
    query = conn.body_params["query"] || conn.body_params["q"] || ""
    case AiDevSuiteTui.api_research(query) do
      {:ok, output} -> send_json(conn, 200, %{result: output})
      {:error, err} -> send_json(conn, 500, %{error: to_string(err)})
    end
  end

  get "/api/config" do
    send_json(conn, 200, %{config_dir: AiDevSuiteTui.api_config_dir()})
  end

  get "/api/preferences" do
    prefs = AiDevSuiteTui.api_preferences_read()
    send_json(conn, 200, prefs)
  end

  put "/api/preferences" do
    case AiDevSuiteTui.api_preferences_write(conn.body_params || %{}) do
      {:ok, prefs} -> send_json(conn, 200, prefs)
      {:error, err} -> send_json(conn, 500, %{error: to_string(err)})
    end
  end

  # llama.cpp server management
  get "/api/server/status" do
    status = AiDevSuiteTui.LlamaCppServer.status()
    send_json(conn, 200, status)
  end

  get "/api/server/config" do
    cfg = AiDevSuiteTui.LlamaCppServer.get_config()
    send_json(conn, 200, cfg)
  end

  put "/api/server/config" do
    params = conn.body_params || %{}
    case AiDevSuiteTui.LlamaCppServer.put_config(params) do
      {:ok, cfg} -> send_json(conn, 200, cfg)
      {:error, err} -> send_json(conn, 500, %{error: to_string(err)})
    end
  end

  post "/api/server/start" do
    case AiDevSuiteTui.LlamaCppServer.start_server() do
      {:ok, info} -> send_json(conn, 200, info)
      {:error, reason} -> send_json(conn, 500, %{error: to_string(reason)})
    end
  end

  post "/api/server/stop" do
    AiDevSuiteTui.LlamaCppServer.stop_server()
    send_json(conn, 200, %{ok: true})
  end

  get "/api/debug/behavior" do
    send_json(conn, 200, AiDevSuiteTui.api_debug_behavior())
  end

  get "/" do
    html = """
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Zerwiz AI Dev Suite API</title></head>
    <body style="font-family:system-ui;background:#030406;color:#d1d5db;margin:2em;max-width:40em">
      <h1><span style="color:#ff3b30">Zerwiz AI</span><span style="color:#d1d5db"> Dev Suite</span></h1>
      <p>API is running. Use the desktop app or open the UI in your browser:</p>
      <p><a href="http://localhost:5174" style="color:#0ea5e9">Open UI → http://localhost:5174</a></p>
      <p><small>Run <code>npm run dev</code> in electron_app for the React dev server.</small></p>
    </body>
    </html>
    """
    conn
    |> put_resp_content_type("text/html")
    |> send_resp(200, html)
  end

  match _ do
    send_resp(conn, 404, "Not Found")
  end

  defp parse_index(n) when is_integer(n), do: n
  defp parse_index(s) when is_binary(s) do
    case Integer.parse(s) do {i, _} -> i; _ -> nil end
  end
  defp parse_index(_), do: nil

  defp stream_chat_loop(conn) do
    receive do
      {:stream_chunk, data} ->
        case Plug.Conn.chunk(conn, data) do
          {:ok, new_conn} -> stream_chat_loop(new_conn)
          {:error, _} -> conn
        end
      :stream_done ->
        conn
    after
      320_000 -> conn
    end
  end

  defp stringify_keys(%{role: r, content: c}), do: %{"role" => to_string(r), "content" => to_string(c)}
  defp stringify_keys(%{"role" => r, "content" => c}), do: %{"role" => to_string(r), "content" => to_string(c)}
  defp stringify_keys(other), do: other

  defp send_json(conn, status, data) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status, Jason.encode!(data))
  end
end
