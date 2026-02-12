defmodule AiDevSuiteTui.CLI do
  @moduledoc """
  Interactive CLI for AI Dev Suite. Run: mix escript.build && ./ai_dev_suite_tui
  """

  @red "\e[91m"
  @white "\e[1;37m"
  @dim "\e[2m"
  @reset "\e[0m"

  def main(_args) do
    print_header()
    print_menu()
    loop()
  end

  defp print_header do
    IO.puts("")
    IO.puts("  #{@red}●#{@reset} #{@red}Zerwiz AI#{@reset} #{@white}Dev Suite#{@reset}")
    IO.puts("  #{@dim}Select tools to install. WhyNot Productions · whynotproductions.netlify.app#{@reset}")
    IO.puts("")
  end

  defp print_menu do
    IO.puts("  #{@white}Core Tools#{@reset}")
    IO.puts("  #{@dim}────────────────────────────────────────#{@reset}")
    tools = AiDevSuiteTui.tools()
    Enum.with_index(tools, 1) |> Enum.each(fn {t, i} ->
      IO.puts("  #{AiDevSuiteTui.format_tool(i, t)}")
    end)
    IO.puts("")
    IO.puts("  #{@white}[1-6]#{@reset} Install a tool")
    IO.puts("  #{@white}[a]#{@reset}  Install all")
    IO.puts("  #{@white}[o]#{@reset}  Start Ollama (local server)")
    IO.puts("  #{@white}[c]#{@reset}  Chat with Ollama")
    IO.puts("  #{@white}[q]#{@reset}  Quit")
    IO.puts("")
  end

  defp loop do
    IO.write("  #{@dim}> #{@reset}")
    case IO.gets("") |> String.trim() |> String.downcase() do
      "q" <> _ -> IO.puts("\n#{@dim}Bye. More: whynotproductions.netlify.app · cal.com/whynotproductions#{@reset}\n"); System.halt(0)
      "a" <> _ -> install_all()
      "o" <> _ -> start_ollama()
      "c" <> _ -> chat_with_ollama()
      "1" -> install_at(1)
      "2" -> install_at(2)
      "3" -> install_at(3)
      "4" -> install_at(4)
      "5" -> install_at(5)
      "6" -> install_at(6)
      "" -> loop()
      n -> IO.puts("  #{@red}Unknown: #{n}. Use 1-6, a, o, c, or q#{@reset}\n"); loop()
    end
  end

  defp install_at(n) when n in 1..6 do
    tool = AiDevSuiteTui.tools() |> Enum.at(n - 1)
    IO.puts("\n  #{@white}Installing #{tool.name}...#{@reset}")
    IO.puts("  #{@dim}#{tool.cmd}#{@reset}\n")
    AiDevSuiteTui.run_install(tool.cmd)
    IO.puts("")
    loop()
  end

  defp install_at(_), do: loop()

  defp chat_with_ollama do
    case AiDevSuiteTui.list_ollama_models() do
      {:ok, models} ->
        case pick_model(models) do
          nil -> loop()
          :download -> download_model_then_pick()
          model ->
            IO.puts("")
            IO.puts("  #{@dim}Connecting to Ollama...#{@reset}")
            IO.puts("  #{@dim}Type your message, press Enter to send. Type '/bye' to exit.#{@reset}")
            case AiDevSuiteTui.chat_with_ollama(model) do
              {:ok, _} ->
                IO.puts("")
                print_header()
                print_menu()
                loop()
              {:error, :not_found} -> IO.puts("  #{@red}Ollama not found.#{@reset}\n"); loop()
            end
        end
      {:error, :not_found} ->
        IO.puts("\n  #{@red}Ollama not found. Install it first (option 3).#{@reset}\n")
        loop()
    end
  end

  defp download_model_then_pick do
    models = AiDevSuiteTui.downloadable_models()
    IO.puts("\n  #{@white}Download Ollama model#{@reset}\n")
    models
    |> Enum.with_index(1)
    |> Enum.each(fn {model, i} ->
      IO.puts("  #{@red}[#{i}]#{@reset} #{model}")
    end)
    IO.puts("")
    IO.write("  #{@dim}Enter number (1-#{length(models)}) or q to cancel: #{@reset}")
    input = IO.gets("") |> String.trim() |> String.downcase()
    case input do
      "q" ->
        IO.puts("")
        loop()
      n ->
        case Integer.parse(n) do
          {idx, _} when idx >= 1 and idx <= length(models) ->
            model = Enum.at(models, idx - 1)
            IO.puts("")
            case AiDevSuiteTui.pull_ollama_model(model) do
              {:ok, _} ->
                IO.puts("\n  #{@white}Model downloaded. Pick a model to chat:#{@reset}")
                chat_with_ollama()
              {:error, :not_found} ->
                IO.puts("  #{@red}Ollama not found.#{@reset}\n")
                loop()
              {:error, code} ->
                IO.puts("  #{@red}Pull failed (exit #{code}).#{@reset}\n")
                loop()
            end
          _ ->
            IO.puts("  #{@red}Invalid. Use 1-#{length(models)} or q.#{@reset}\n")
            loop()
        end
    end
  end

  defp pick_model(models) do
    IO.puts("\n  #{@white}Chat with Ollama – pick a model#{@reset}\n")
    if raw_mode_available?() do
      try do
        set_raw_mode()
        pick_loop(models, 0, true)
      after
        restore_tty()
      end
    else
      pick_model_numbered(models)
    end
  end

  # Option labels for picker (index 0 = download, 1..n = models)
  defp model_options(models) do
    ["Download model..."] ++ models
  end

  defp raw_mode_available? do
    # Check if stdin is TTY and stty works (fails in some IDE terminals)
    {_, exit_code} = System.cmd("sh", ["-c", "[ -t 0 ] && stty -g >/dev/null 2>&1"])
    exit_code == 0
  end

  defp pick_model_numbered(models) do
    opts = model_options(models)
    opts
    |> Enum.with_index(0)
    |> Enum.each(fn {label, i} ->
      IO.puts("  #{@red}[#{i}]#{@reset} #{label}")
    end)
    IO.puts("")
    IO.write("  #{@dim}Enter number (0-#{length(models)}) or q to cancel: #{@reset}")
    input = IO.gets("") |> String.trim() |> String.downcase()
    case input do
      "q" -> nil
      n ->
        case Integer.parse(n) do
          {0, _} -> :download
          {idx, _} when idx >= 1 and idx <= length(models) -> Enum.at(models, idx - 1)
          _ -> nil
        end
    end
  end

  defp pick_loop(models, sel, first) do
    opts = model_options(models)
    render_model_options(opts, sel, first)
    case read_key() do
      :up -> pick_loop(models, max(0, sel - 1), false)
      :down -> pick_loop(models, min(length(opts) - 1, sel + 1), false)
      :enter ->
        if sel == 0 do
          :download
        else
          Enum.at(models, sel - 1)
        end
      :cancel -> nil
      _ -> pick_loop(models, sel, false)
    end
  end

  defp render_model_options(opts, sel, first) do
    n = length(opts)
    if n > 0 and not first, do: IO.write("\e[#{n}A")
    opts
    |> Enum.with_index()
    |> Enum.each(fn {label, i} ->
      prefix = if i == sel, do: "> ", else: "  "
      IO.write("\r\e[2K  #{prefix}#{label}\n")
    end)
  end

  defp read_key do
    c = IO.binread(:stdio, 1)
    case c do
      :eof -> :cancel
      nil -> :cancel
      "\r" -> :enter
      "\n" -> :enter
      "q" -> :cancel
      "Q" -> :cancel
      <<27>> ->
        c2 = IO.binread(:stdio, 1)
        c3 = IO.binread(:stdio, 1)
        case {c2, c3} do
          {"[", "A"} -> :up
          {"[", "B"} -> :down
          _ -> :other
        end
      _ -> :other
    end
  end

  defp set_raw_mode do
    System.cmd("stty", ["raw", "-echo", "min", "1"])
  end

  defp restore_tty do
    System.cmd("stty", ["sane"])
    IO.write("\n")
  end

  defp start_ollama do
    case AiDevSuiteTui.start_ollama() do
      {:ok, _} ->
        IO.puts("\n  #{@white}Ollama started in background.#{@reset}")
        IO.puts("  #{@dim}API at http://localhost:11434 · Use 'ollama run <model>' to run models#{@reset}")
        IO.puts("  #{@dim}Logs: /tmp/ollama.log#{@reset}\n")
        loop()
      {:error, :not_found} ->
        IO.puts("\n  #{@red}Ollama not found. Install it first (option 3).#{@reset}\n")
        loop()
    end
  end

  defp install_all do
    IO.puts("\n  #{@white}Installing all tools...#{@reset}\n")
    AiDevSuiteTui.tools() |> Enum.each(fn tool ->
      IO.puts("  #{@dim}► #{tool.name}#{@reset}")
      AiDevSuiteTui.run_install(tool.cmd)
      IO.puts("")
    end)
    loop()
  end
end
