defmodule CORSPlug do
  import Plug.Conn
  def init(opts), do: opts
  def call(conn, _opts) do
    conn
    |> put_resp_header("access-control-allow-origin", "*")
    |> put_resp_header("access-control-allow-methods", "GET, POST, OPTIONS")
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

defmodule AiDevSuiteTui.ApiRouter do
  use Plug.Router
  require Logger

  plug(Plug.Logger)
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
    kb = conn.body_params["knowledge_base"] || conn.body_params["knowledgeBase"]
    system = AiDevSuiteTui.api_build_system_prompt(kb)
    all = [%{"role" => "system", "content" => system} | Enum.map(messages, &stringify_keys/1)]
    case AiDevSuiteTui.api_chat_send(model, all) do
      {:ok, %{"message" => %{"content" => content}}} ->
        send_json(conn, 200, %{reply: content})
      {:error, err} ->
        send_json(conn, 500, %{error: to_string(err)})
    end
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
    lines = AiDevSuiteTui.list_knowledge_base_contents(name)
    send_json(conn, 200, %{items: lines})
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

  defp stringify_keys(%{role: r, content: c}), do: %{"role" => to_string(r), "content" => to_string(c)}
  defp stringify_keys(%{"role" => r, "content" => c}), do: %{"role" => to_string(r), "content" => to_string(c)}
  defp stringify_keys(other), do: other

  defp send_json(conn, status, data) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status, Jason.encode!(data))
  end
end
