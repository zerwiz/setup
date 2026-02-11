defmodule AiDevSuiteTui.CLI do
  @moduledoc """
  Interactive CLI for AI Dev Suite. Run: mix escript.build && ./ai_dev_suite_tui
  """

  @red "\e[91m"
  @cyan "\e[96m"
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
    IO.puts("  #{@red}●#{@reset} #{@white}AI Dev Suite#{@reset}")
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
    IO.puts("  #{@white}[1-5]#{@reset} Install a tool")
    IO.puts("  #{@white}[a]#{@reset}  Install all")
    IO.puts("  #{@white}[q]#{@reset}  Quit")
    IO.puts("")
  end

  defp loop do
    IO.write("  #{@dim}> #{@reset}")
    case IO.gets("") |> String.trim() |> String.downcase() do
      "q" <> _ -> IO.puts("\n#{@dim}Bye. More: whynotproductions.netlify.app · cal.com/whynotproductions#{@reset}\n"); System.halt(0)
      "a" <> _ -> install_all()
      "1" -> install_at(1)
      "2" -> install_at(2)
      "3" -> install_at(3)
      "4" -> install_at(4)
      "5" -> install_at(5)
      "" -> loop()
      n -> IO.puts("  #{@red}Unknown: #{n}. Use 1-5, a, or q#{@reset}\n"); loop()
    end
  end

  defp install_at(n) when n in 1..5 do
    tool = AiDevSuiteTui.tools() |> Enum.at(n - 1)
    IO.puts("\n  #{@white}Installing #{tool.name}...#{@reset}")
    IO.puts("  #{@dim}#{tool.cmd}#{@reset}\n")
    AiDevSuiteTui.run_install(tool.cmd)
    IO.puts("")
    loop()
  end

  defp install_at(_), do: loop()

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
